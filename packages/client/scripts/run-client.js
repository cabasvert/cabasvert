#!/usr/bin/env node
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

const nodeCleanup = require('node-cleanup');
const { run, runDaemon, setupExitHandler, sleep } = require('../../../scripts/run-utils');

async function main() {
  let { watch } = parseArgs();

  const cleanupHandlers = [];

  async function cleanup() {
    for (let i = cleanupHandlers.length - 1; i >= 0; i--) {
      await cleanupHandlers[i]();
    }
  }

  setupExitHandler(cleanup);

  try {

    // Launch tsc
    if (watch) {
      cleanupHandlers.push(
          await runDaemon('tsc', ['--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
      );

      // Wait for tsc to kick in
      await sleep(5000);
    }

    // Launch server
    try {
      await (watch ? runWatchServer : runServer)();
    } catch (err) {
      // Ignore server's SIGINT
      if (err.code !== 2 && err.code !== 128 + 2 && err.signal !== 'SIGINT') {
        console.error('\n', err, '\n');
      }
    }

  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  } finally {
    await cleanup();
  }
}

async function runServer() {
  return run('node', ['dist/cli'], { stdio: 'inherit' });
}

async function runWatchServer() {
  return run('nodemon', ['--inspect', 'dist/cli', '--watch', 'dist'], { stdio: 'inherit' });
}

function usage() {
  console.log('usage: node scripts/run-server.js [--watch]');
}

function parseArgs() {
  let args = process.argv;

  if (args.length > 3) {
    console.error('Wrong number of arguments.');
    usage();
    process.exit(1);
  }

  let [, , watch] = args;

  if (watch && watch !== '--watch') {
    console.error('Wrong arguments.');
    usage();
    process.exit(1);
  }

  return { watch: watch === '--watch' };
}

// noinspection JSIgnoredPromiseFromCall
main();
