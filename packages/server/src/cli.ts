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

import * as http from 'http'
import * as parseCli from 'minimist'
import { Configuration, parseJsonFile, writeClientConfiguration } from './config'
import { startServer } from './index'

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
  // application specific logging, throwing an error, or other logic here
})

let argv = parseCli(process.argv.slice(2))
let configPath = argv['config'] || 'config.json'
let configuration = parseJsonFile<Configuration>(configPath)

let generateClientConfig = argv['generate-client-config']
if (generateClientConfig !== null) {
  writeClientConfiguration(configuration, generateClientConfig)
}

let server: Promise<http.Server> = startServer(configuration)
