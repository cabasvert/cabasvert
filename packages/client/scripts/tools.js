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
const commandExists = require('command-exists');
const Listr = require('listr');
const utils = require('./../../../scripts/utils');
const { run, runDaemon } = require('../../../scripts/run-utils');

const cwd = path.resolve(__dirname, '../');
const artifactsDir = `${cwd}/artifacts`;

async function start({ watch, prod, env, prefix }) {
  if (watch && prod) {
    console.log('No prod build in watch mode. Omitting --prod.');
  }

  if (watch) {
    return {
      destroy: await runDaemon('ng', ['run', 'app:serve:development'], {
        stdio: 'inherit',
        cwd,
        prefix,
      }),
      host: 'http://locahost:8100',
    };
  } else {
    await build({ target: 'browser', prod, noPack: true, prefix });

    const port = prod ? 8200 : 8100;
    return {
      destroy: await serve(port, `${cwd}/www`, prefix),
      host: `http://locahost:${port}`,
    };
  }
}

async function build({ target, dev, debug, prod, noPack, prefix }) {
  const env = dev ? 'development' : debug ? 'debug' : prod ? 'production' : null;
  await doBuild(target || 'browser', env || 'development', noPack, prefix);
}

async function doBuild(target, env, noPack, prefix) {

  const { version } = utils.readPackageJson(cwd);

  await run('rm', ['-rf', `www`, `artifacts`], { cwd, prefix });

  await run('scripts/set-versions.js', [], { cwd, prefix });

  await run('ng', ['build', '--progress=false', `--configuration=${env}`, 'app'], { cwd, prefix });

  if (env !== 'development' && !noPack) {

    if (target === 'browser' || target === 'all') {
      await createArtifactsDir();
      await packBrowserBuild(version);
    }

    const canBuildAndroid = !!env['ANDROID_HOME'];
    const canBuildIos = await commandExists('pod').catch(() => false);

    if (target === 'android' || (target === 'all' && canBuildAndroid)) {
      await run('npx', ['cap', 'sync', 'android'], { cwd, prefix });

      const assembly = { 'debug': 'debug', 'production': 'release' }[env];
      await createArtifactsDir();
      let artifactFile = await buildApk(assembly);
      await copyApk(assembly, version, artifactFile);
    }

    if (target === 'ios' || (target === 'all' && canBuildIos)) {
      await run('npx', ['cap', 'sync', 'ios'], { cwd, prefix });

      // TODO xcodebuild -scheme App build
    }
  }
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
  await run('tar', ['cvzf', archiveFile, '--exclude=config.prod.json', 'www'], { cwd });
}

async function buildApk(assembly) {
  const capitalizedAssembly = assembly.charAt(0).toUpperCase() + assembly.substr(1);
  await run('./gradlew', [`assemble${capitalizedAssembly}`], { cwd: `${cwd}/android` });

  const buildOutputsDir = path.join(cwd, 'android', 'app', 'build', 'outputs');
  return path.join(buildOutputsDir, 'apk', assembly, `app-${assembly}.apk`);
}

async function copyApk(assembly, version, artifactFile) {
  const destination = path.join(artifactsDir, `cabasvert-client-${assembly}-${version}.apk`);
  await fs.copyFile(artifactFile, destination);
}

async function serve(port, path, prefix) {
  const express = require('express');
  const app = express();

  app.use(express.static(path));
  app.get('*', function (req, res) {
    res.sendFile(path + '/index.html');
  });

  return new Promise((resolve) => {
    let httpServer = app.listen(port, () => {
      console.log(`${prefix}Listening on port ${port}`);
      resolve(async () => httpServer.close());
    });
  });
}

module.exports = {
  build,
  start,
};
