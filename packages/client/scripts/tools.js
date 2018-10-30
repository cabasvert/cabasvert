/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');
const Listr = require('listr');
const utils = require('./../../../scripts/utils');
const { run, runDaemon } = require('../../../scripts/run-utils');

const packageDir = process.cwd();
const artifactsDir = 'artifacts';

async function start({ watch, prod, env }) {
  if (watch && prod) {
    console.log('No prod build in watch mode. Omitting --prod.')
  }

  if (watch) {
    return {
      destroy: await runDaemon('ng', ['run', 'app:serve:development'], { stdio: 'inherit' }),
      host: 'http://locahost:8100',
    };
  } else {
    await build({ target: 'browser', prod, noPack: true });

    const port = prod ? 8200 : 8100;
    return {
      destroy: await runDaemon('http-server', ['-p', port, 'www'], { stdio: 'inherit' }),
      host: `http://locahost:${port}`,
    };
  }
}

async function build({ target, dev, debug, prod, noPack }) {
  const env = dev ? 'development' : debug ? 'debug' : prod ? 'production' : null;
  const tasks = makeBuildTask(target || 'browser', env || 'development', noPack);

  await tasks.run();
}

function makeBuildTask(target, env, noPack) {

  const { version } = utils.readPackageJson(packageDir);

  const tasks = [];

  tasks.push({
    title: `Clean`,
    task: () => execa('rm', ['-rf', `www`, `artifacts`]),
  });

  tasks.push({
    title: `Set versions`,
    task: () => execa('scripts/set-versions'),
  });

  tasks.push({
    title: `Build with Angular (${env})`,
    task: () => execa('ng', ['run', `app:build:${env}`]),
  });

  if (env !== 'development' && !noPack) {

    if (target === 'browser' || target === 'all') {
      tasks.push({
        title: `Pack browser build`,
        task: async () => {
          await createArtifactsDir();
          await packBrowserBuild(version);
        },
      });
    }

    if (target === 'android' || target === 'all') {
      tasks.push({
        title: `Synchronize Capacitor`,
        task: () => execa('npx', ['cap', 'sync']),
      });

      const assembly = { 'debug': 'debug', 'production': 'release' }[env];
      tasks.push({
        title: `Build with Gradle/Android (${assembly})`,
        task: async () => {
          await createArtifactsDir();
          let artifactFile = await buildApk(assembly);
          await copyApk(assembly, version, artifactFile);
        },
      });
    }

  }

  return new Listr(tasks);
}

async function createArtifactsDir() {
  try {
    await fs.mkdir(artifactsDir);
  } catch (e) {
  }
}

async function packBrowserBuild(version) {
  const archiveFilename = 'cabasvert-client-browser-' + version + '.tar.gz';
  const archiveFile = path.join(artifactsDir, archiveFilename);
  await execa('tar', ['cvzf', archiveFile, '--exclude=config.prod.json', 'www']);
}

async function buildApk(assembly) {
  const capitalizedAssembly = assembly.charAt(0).toUpperCase() + assembly.substr(1);
  await execa('./gradlew', [`assemble${capitalizedAssembly}`], { cwd: './android' });

  const buildOutputsDir = path.join('android', 'app', 'build', 'outputs');
  return path.join(buildOutputsDir, 'apk', assembly, `app-${assembly}.apk`);
}

async function copyApk(assembly, version, artifactFile) {
  const destination = path.join(artifactsDir, `cabasvert-client-${assembly}-${version}.apk`);
  await fs.copyFile(artifactFile, destination);
}

module.exports = {
  build,
  start,
};
