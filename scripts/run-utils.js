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

function npm(cmd, args) {
  console.log('> ' + cmd + (args ? ' ' + args.join(' ') : ''));
  return execa('npx', [cmd, ...(args || [])]);
}

function npmDaemon(cmd, args, cleanup) {
  console.log('> ' + cmd + (args ? ' ' + args.join(' ') : ''));
  return runDaemon('npx', [cmd, ...(args || [])], cleanup);
}

function docker(image, ports) {
  const name = image.replace('/', '-').replace(':', '-') + '-' + Date.now();

  let args = [
    'run',
    ...ports.reduce((acc, port) => [...acc, '-p', port], []),
    '--name', name,
    '-d', image
  ];

  console.log('Starting docker image \'' + image + '\'');
  return run('docker', args).then(function () {
    return {
      destroy: function () {
        console.log('Stopping docker container');
        return run('docker', ['stop', name]).then(function () {
          console.log('Removing docker container');
          return run('docker', ['rm', name]);
        });
      },
    };
  });
}

function run(cmd, args) {
  console.log('> ' + cmd + (args ? ' ' + args.join(' ') : ''));
  return execa(cmd, args);
}

function runDaemon(bin, args, cleanup) {
  const cmd = bin + (args ? ' ' + args.join(' ') : '');

  const daemonProcess = execa(bin, args);

  console.log('Starting daemon');
  return Promise.resolve().then(function () {
    return {
      destroy: async function () {
        console.log('Stopping daemon');
        await daemonProcess.kill();
        if (cleanup) await cleanup();
      },
    };
  });
}

module.exports = {
  npm,
  npmDaemon,
  docker,
};
