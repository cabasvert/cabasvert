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

import { environment } from '../../environments/environment';
import { LogLevel } from '../toolkit/providers/log.model';

declare const process: any;

export interface Configuration {
  base: {
    databaseUrl: string
    serverUrl: string

    remoteDBOnly: boolean
    wipeLocalDB: boolean
    debugPouch: boolean
  };
  log: {
    [name: string]: LogLevel
  };
}

export function defaultConfiguration() {
  let defaultLogLevel = environment.defaultLogLevel;

  return {
    base: {
      databaseUrl: 'http://localhost:5984',
      serverUrl: 'http://localhost:8080',

      remoteDBOnly: false,
      wipeLocalDB: false,
      debugPouch: false,
    },
    log: {
      'App': defaultLogLevel,
      'Database': defaultLogLevel,
      'Database|Remote': defaultLogLevel,
      'Database|Local': defaultLogLevel,
      'Auth': defaultLogLevel,
    },
  };
}
