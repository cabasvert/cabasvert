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

const { build } = require('./tools');
const meow = require('meow');

const cli = meow(`
    Usage
      $ start.js [all|browser|android]
 
    Options
      --debug     Make a debug build
      --prod      Make a production build
      --apk       Use APK format
`, {
  booleanDefault: undefined,
  flags: {
    debug: {
      type: 'boolean',
      default: false,
    },
    prod: {
      type: 'boolean',
      default: false,
    },
    apk: {
      type: 'boolean',
      default: false,
    },
  },
});

build({
  target: cli.input[0],
  flags: cli.flags,
  env: process.env,
});
