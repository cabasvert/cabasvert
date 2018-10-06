/**
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

/**
 * This file rewrites node_modules/@angular-devkit/build-angular to enable crypto-browserify.
 * It must be called by npm after install. Make sure that your package.json includes:
 * {
 *   "scripts": {
 *     "prepare": "node bin/patch-angular.js"
 *   }
 * }
 */

const fs = require('fs');

let filename = '/src/angular-cli-files/models/webpack-configs/browser.js';
let localModule = 'node_modules/@angular-devkit/build-angular';
let rootModule = '../../' + localModule;

try {
  rewriteNodeSettings(localModule + filename);
  console.log('Correctly rewrote angular node config in ' + localModule);
} catch (error) {
  try {
    rewriteNodeSettings(rootModule + filename);
    console.log('Correctly rewrote angular node config in ' + rootModule);
  } catch (error) {
    console.error('Failed to rewrite angular node config', error);
  }
}

function rewriteNodeSettings(file) {
  let data = fs.readFileSync(file, 'utf8');
  let result = data.replace(/node: false/g, 'node: {crypto: true, stream: true}');
  fs.writeFileSync(file, result, 'utf8');
}
