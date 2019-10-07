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

async function start({ flags, env, prefix }) {
  const { watch, prod } = flags || {};

  if (watch && prod) {
    console.log('No prod build in watch mode. Omitting --prod.');
  }

  if (watch) {
    return {
      destroy: await runDaemon('ng', ['run', 'app:serve:development'], {
        stdio: 'inherit',
        cwd,
        env,
        prefix,
      }),
      host: 'http://locahost:8100',
    };
  } else {
    await build({ target: 'browser', flags: { prod, noPack: true }, env, prefix });

    const port = prod ? 8200 : 8100;
    return {
      destroy: await serve(port, `${cwd}/www`, prefix),
      host: `http://locahost:${port}`,
    };
  }
}

async function build({ target, flags, env, prefix }) {
  const { debug, prod, noPack, apk } = flags || {};

  target = target || 'browser';
  const configuration = debug ? 'debug' : prod ? 'production' : 'development';

  const { version } = utils.readPackageJson(cwd);

  await run('rm', ['-rf', `www`, `artifacts`], { cwd, prefix });

  await run('scripts/set-versions.js', [], { cwd, prefix });

  await run('ng',
    ['build', '--progress=false', `--configuration=${configuration}`, 'app'],
    { cwd, env, prefix },
  );

  if (configuration !== 'development' && !noPack) {

    if (target === 'browser' || target === 'all') {
      await createArtifactsDir();
      await packBrowserBuild(version);
    }

    const canBuildAndroid = !!env['ANDROID_HOME'];
    if (target === 'android' || target === 'all') {
      if (canBuildAndroid) {

        await run('npx', ['cap', 'sync', 'android'], { cwd, prefix });

        const assembly = { 'debug': 'debug', 'production': 'release' }[configuration];
        await createArtifactsDir();
        let artifactFile = await buildAndroid(assembly, apk);
        await copyAndroid(assembly, version, apk, artifactFile);

      } else {
        console.warn('Can\'t build android target without Android SDK – Skipping');
      }
    }

    const canBuildIos = await commandExists('pod').catch(() => false);
    if (target === 'ios' || target === 'all') {
      if (canBuildIos) {

        await run('npx', ['cap', 'sync', 'ios'], { cwd, prefix });

        // TODO xcodebuild -scheme App build

      } else {
        console.warn('Can\'t build ios target without `pod` – Skipping');
      }
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

async function buildAndroid(assembly, apk) {
  const capitalizedAssembly = assembly.charAt(0).toUpperCase() + assembly.substr(1);
  const builder = apk ? 'assemble' : 'bundle';
  const directory = apk ? 'apk' : 'bundle';
  const extension = apk ? 'apk' : 'aab';
  const suffix = `-${assembly}`;

  await run('./gradlew', [`${builder}${capitalizedAssembly}`], { cwd: `${cwd}/android` });

  const buildOutputsDir = path.join(cwd, 'android', 'app', 'build', 'outputs');
  return path.join(buildOutputsDir, directory, assembly, `app${suffix}.${extension}`);
}

async function copyAndroid(assembly, version, apk, artifactFile) {
  const extension = apk ? 'apk' : 'aab';
  const destination = path.join(artifactsDir, `cabasvert-client-${assembly}-${version}.${extension}`);
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
