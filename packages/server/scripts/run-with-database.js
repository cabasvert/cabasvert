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

const { runWithDatabase } = require('../../../scripts/run-database');
const { run } = require('../../../scripts/run-utils');

async function runArgCommand(databaseHost) {
  await run(process.argv[2], process.argv.slice(3), {
    stdio: 'inherit',
    env: {
      'DATABASE_HOST': databaseHost,
    },
  });
}

async function main() {
  try {

    await runWithDatabase({
      databaseName: process.env.DATABASE,
      databaseHost: process.env.DATABASE_HOST,
    }, runArgCommand);

  } catch (err) {
    if (err.code) {
      process.exit(err.code);
    } else {
      console.error('\n', err, '\n');
      process.exit(1);
    }
  }
}

main();
