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

const chalk = require('chalk');
const { run, setupExitHandler } = require('./run-utils');
const { start: startServer } = require('../packages/server/scripts/tools');
const { start: startClient } = require('../packages/client/scripts/tools');

async function main() {
  let { destroy: serverDestroy } = await startServer({
    env: process.env,
    prefix: chalk.cyanBright('server: '),
  });

  let { destroy: clientDestroy } = await startClient({
    env: process.env,
    prefix: chalk.magentaBright('client: '),
  });

  setupExitHandler(async function () {
    if (clientDestroy) await clientDestroy();
    if (serverDestroy) await serverDestroy();
  });

  try {
    await runArgCommand();
    process.exit(0);
  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  }
}

async function runArgCommand() {
  await run(process.argv[2], process.argv.slice(3), { stdio: 'inherit' });
}

main();