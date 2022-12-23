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

const { runDatabase } = require('./database-utils');
const { run, setupExitHandler } = require('./run-utils');

async function main() {
  try {

    const auth = {
      username: process.env.DATABASE_USERNAME || 'username',
      password: process.env.DATABASE_PASSWORD || 'password',
    };

    // Start the database host
    const { ready, destroy, host, oneShot } = await runDatabase({
      databaseName: process.env.DATABASE,
      databaseHost: process.env.DATABASE_HOST,
    });

    setupExitHandler(async function () {
      if (destroy) await destroy();
    });

    // Wait for the database to be ready
    await ready();

    // Install database fixtures
    const fixtures = process.env.FIXTURES;
    if (oneShot && fixtures) await setupFixtures(fixtures, host, auth);

    try {

      await waitForSIGINT();

    } finally {
      // Destroy the database host
      if (destroy) await destroy();
    }

  } catch (err) {
    if (err.code) {
      process.exit(err.code);
    } else {
      console.error('\n', err, '\n');
      process.exit(1);
    }
  }
}

async function waitForSIGINT() {
  let exit = false;
  process.on('SIGINT', () => {
    exit = true;
  });

  async function sleepUntilExit() {
    if (!exit) {
      await sleep(100);
      await sleepUntilExit();
    }
  }

  await sleepUntilExit();
}

function sleep(timeout) {
  let timeoutHandler;
  const promise = new Promise((resolve) => {
    timeoutHandler = setTimeout(resolve, timeout);
  });
  return Object.assign(promise, { cancel: () => clearTimeout(timeoutHandler) });
}

async function setupFixtures(fixtures, host, auth) {
  const authParams = [`--username=${auth.username}`, `--password=${auth.password}`];

  await run('cvt', [
    `--host=${host}`, ...authParams,
    'setup',
  ], { stdio: 'inherit' });

  await run('cvt', [
    `--host=${host}`, ...authParams, '--db-name=_users',
    'backup', 'restore', `./${fixtures}-users.json`,
  ], { stdio: 'inherit' });

  await run('cvt', [
    `--host=${host}`, ...authParams, '--db-name=test',
    'backup', 'restore', `./${fixtures}-data.json`,
  ], { stdio: 'inherit' });
}

// noinspection JSIgnoredPromiseFromCall
main();
