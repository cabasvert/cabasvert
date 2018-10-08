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
const licence = require('license-check-and-add');

let packageDir = process.cwd();
let rootDir = path.join(packageDir, '../../');

async function main() {
  try {
    let insert_license = process.argv[2] === '--fix';

    licence.run({
      folder: '.',
      license: path.join(rootDir, 'assets/licenses/header.txt'),
      exact_paths_method: 'INCLUDE',
      exact_paths: [
        'scripts', 'src', 'test', 'e2e',
      ],
      file_type_method: 'INCLUDE',
      file_types: ['.js', '.ts', '.html', '.css', '.scss'],
      trailing_whitespace: 'TRIM',
      default_format: { prepend: '/*', append: ' */\n', eachLine: { prepend: ' * ' } },
      license_formats: {
        'js|ts|css|scss': { prepend: '/*', append: ' */\n', eachLine: { prepend: ' * ' } },
        'html': { prepend: '<!--', append: '-->\n', eachLine: { prepend: '  ' } },
      },
      insert_license,
    });
  } catch (err) {
    console.error('\n', err, '\n');
    process.exit(1);
  }
}

main();
