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

import { LogLevel } from "../toolkit/providers/log.model"

declare const process: any

class Environment {
  public readonly node: string
  public readonly ionic: string

  constructor(node: string, ionic: string) {
    this.node = Environment.shortenEnvVar(node)
    this.ionic = Environment.shortenEnvVar(ionic)
  }

  get isNodeProd() {
    return Environment.isProd(this.node)
  }

  get isIonicProd() {
    return Environment.isProd(this.ionic)
  }

  private static shortenEnvVar(envVar: string) {
    return envVar === 'development' ? 'dev' :
      envVar === 'production' ? 'prod' : envVar
  }

  private static isProd(envVar: string) {
    return envVar === 'prod'
  }
}

export function environment(): Environment {
  let node = process.env.NODE_ENV || 'dev'
  let ionic = process.env.IONIC_ENV || 'dev'
  return new Environment(node, ionic)
}

export interface Configuration {
  base: {
    databaseUrl: string
    serverUrl: string

    remoteDBOnly: boolean
    wipeLocalDB: boolean
    debugPouch: boolean
  }
  log: {
    [name: string]: LogLevel
  }
}

export function defaultConfiguration() {
  let ionicProd = environment().isIonicProd
  let defaultLogLevel = ionicProd ? LogLevel.WARN : LogLevel.DEBUG

  return {
    base: {
      databaseUrl: 'http://localhost:5984',
      serverUrl: 'http://localhost:8080',

      remoteDBOnly: false,
      wipeLocalDB: false,
      debugPouch: false,
    },
    log: {
      'Database': defaultLogLevel,
      'Database|Remote': defaultLogLevel,
      'Database|Local': defaultLogLevel,
      'Auth': defaultLogLevel,
    },
  }
}
