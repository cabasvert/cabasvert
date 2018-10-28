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

const execa = require('execa');
const nodeCleanup = require('node-cleanup');

function docker(image, ports) {
  const name = image.replace('/', '-').replace(':', '-') + '-' + Date.now();

  let args = [
    'run',
    ...ports.reduce((acc, port) => [...acc, '-p', port], []),
    '--name', name,
    '-d', image,
  ];

  return run('docker', args).then(function () {
    return async () => {
      await run('docker', ['stop', name]);
      await run('docker', ['rm', name]);
    };
  });
}

function run(bin, args, opts) {
  console.log('$ ' + bin + (args ? ' ' + args.join(' ') : ''));
  return execa(bin, args, opts);
}

function runDaemon(bin, args, opts) {
  console.log('$ ' + bin + (args ? ' ' + args.join(' ') : ''));

  const { cleanupHandler } = opts || {};
  const daemonProcess = execa(bin, args, opts);

  return Promise.resolve().then(function () {
    return async () => {
      await daemonProcess.kill();
      if (cleanupHandler) await cleanupHandler();
    };
  });
}

function setupExitHandler(cleanup) {
  nodeCleanup((exitCode, signal) => {
    if (signal === 'SIGINT') {
      return false;
    } else if (signal) {
      cleanup().then(() => {
        process.kill(process.pid, signal);
      });
      nodeCleanup.uninstall();
      return false;
    }
  });
}

function sleep(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

module.exports = {
  docker,
  run,
  runDaemon,
  setupExitHandler,
  sleep,
};
