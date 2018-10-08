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

function readPackageJson(dir) {
  const packagePath = path.join(dir, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
}

async function checkGit() {
  if (await execa.stdout('git', ['status', '--porcelain']) !== '') {
    throw new Error(`Unclean working tree. Commit or stash changes first.`);
  }
  if (await execa.stdout('git', ['rev-list', '--count', '--left-only', '@{u}...HEAD']) !== '0') {
    throw new Error(`Remote history differs. Please pull changes.`);
  }
}

module.exports = {
  readPackageJson,
  checkGit,
};