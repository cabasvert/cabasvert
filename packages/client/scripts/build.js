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

// args: [all|browser|android] [--dev|--debug|--prod]

async function main() {
  let { target, env } = parseArgs();
  let tasks = makeBuildTask(target || 'all', env || 'production');

  try {
    await tasks.run();
  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  }
}

function usage() {
  console.log('usage: node scripts/build.js [all|browser|android] [--dev|--debug|--prod]')
}

function parseArgs() {
  let args = process.argv;

  if (args.length > 4) {
    console.error('Wrong number of arguments.');
    usage();
    process.exit(1);
  }

  let [, , target, env] = args;

  if (target && target.startsWith('--')) {
    [target, env] = [env, target];
  }

  if ((target && ['all', 'browser', 'android'].indexOf(target) === -1)
    || (env && ['--dev', '--debug', '--prod'].indexOf(env) === -1)) {
    console.error('Wrong arguments.');
    usage();
    process.exit(1);
  }

  if (env) {
    env = env.substring(2);
    env = { 'dev': 'development', 'debug': 'debug', 'prod': 'production' }[env] || env;
  }

  return { target, env }
}

let packageDir = process.cwd();
let artifactsDir = 'artifacts';

function makeBuildTask(target, env) {

  let { version } = utils.readPackageJson(packageDir);

  let tasks = [];

  tasks.push({
    title: `Build with Angular (${env})`,
    task: () => execa('ng', ['run', `app:build:${env}`])
  });

  if (env !== 'development') {

    if (target === 'browser' || target === 'all') {
      tasks.push({
        title: `Pack browser build`,
        task: async () => {
          await createArtifactsDir();
          await packBrowserBuild(version);
        }
      });
    }

    if (target === 'android' || target === 'all') {
      tasks.push({
        title: `Synchronize Capacitor`,
        task: () => execa('npx', ['cap', 'sync'])
      });

      let assembly = { 'debug': 'debug', 'production': 'release' }[env];
      tasks.push({
        title: `Build with Gradle/Android (${assembly})`,
        task: async () => {
          await createArtifactsDir();
          let artifactFile = await buildApk(assembly);
          await copyApk(assembly, version, artifactFile);
        }
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
  let archiveFilename = 'cabasvert-client-browser-' + version + '.tar.gz';
  let archiveFile = path.join(artifactsDir, archiveFilename);
  await execa('tar', ['cvzf', archiveFile, '--exclude=config.prod.json', 'www']);
}

async function buildApk(assembly) {
  let capitalizedAssembly = assembly.charAt(0).toUpperCase() + assembly.substr(1);
  await execa('./gradlew', [`assemble${capitalizedAssembly}`], { cwd: './android' });

  let buildOutputsDir = path.join('android', 'app', 'build', 'outputs');
  return path.join(buildOutputsDir, 'apk', assembly, `app-${assembly}.apk`);
}

async function copyApk(assembly, version, artifactFile) {
  let destination = path.join(artifactsDir, `cabasvert-client-${assembly}-${version}.apk`);
  await fs.copyFile(artifactFile, destination);
}

main();
