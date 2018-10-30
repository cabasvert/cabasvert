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
const { run, runDaemon } = require('../../../scripts/run-utils');

const cwd = path.resolve(__dirname, '../');

async function build({ prefix }) {
  await run('tsc', ['--build', 'src/tsconfig.build.json'], { stdio: 'inherit', cwd, prefix });
}

async function start({ watch, prod, env, prefix }) {
  let destroy;

  if (watch) {
    destroy = await runDaemon('ts-node-dev', ['src/cli.ts'], { stdio: 'inherit', cwd, prefix });
  } else {
    await build({ prefix });

    destroy = await runDaemon('node', ['dist/cli'], { stdio: 'inherit', cwd, prefix });
  }

  return {
    host: 'http://locahost:4000',
    destroy,
  };
}

module.exports = {
  build,
  start,
};
