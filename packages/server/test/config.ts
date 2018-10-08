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

import { Configuration } from '../src/config'

export function testConfiguration(): Configuration {

  const { databaseHost } = global['__testConfig__']

  return {
    'port': 8080,
    'clientApplication': {
      'url': 'http://localhost:8080',
    },
    'serverApplication': {
      'url': 'http://localhost:8080',
    },
    'database': {
      'url': databaseHost,
      'auth': {
        'username': 'server-username',
        'password': 'server-password',
      },
    },
    'email': 'email@example.com',
    'smtpConnection': {
      'host': 'smtp.example.com',
      'port': 587,
      'secure': false,
      'auth': {
        'user': 'email-username',
        'pass': 'email-password',
      },
      'requireTLS': true,
    },
  }
}
