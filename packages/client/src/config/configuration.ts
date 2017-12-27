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

import { LogLevel } from "../toolkit/providers/log-service"

declare const process: any

type Environment = { node: string, ionic: string }

export function environment(): Environment {
  let node = process.env.NODE_ENV || 'dev'
  let ionic = process.env.IONIC_ENV || 'dev'
  return { node, ionic }
}

export function configuration() {
  let env = environment()
  if (env.ionic === 'prod') {
    if (!process.env.DATABASE_URL) {
      console.error('This is a production build but DATABASE_URL is not set!')
    }
    if (!process.env.SERVER_URL) {
      console.error('This is a production build but SERVER_URL is not set!')
    }
  }

  return {
    databaseUrl: process.env.DATABASE_URL || 'http://localhost:5984',
    serverUrl: process.env.SERVER_URL || 'http://localhost:8080',

    remoteDBOnly: false,
    wipeLocalDB: false,
    debugPouch: false,
  }
}

export function logConfiguration() {
  let env = environment()
  let ionicProd = env.ionic == 'prod'

  return {
    'Database': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Database|Remote': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Database|Local': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Auth': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
  }
}
