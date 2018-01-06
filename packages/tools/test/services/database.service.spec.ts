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

import 'jasmine'
import 'reflect-metadata'

import * as PouchHttp from 'pouchdb-adapter-http'
import * as PouchAuth from 'pouchdb-authentication'
import * as PouchDB from 'pouchdb-core'
import * as PouchFind from 'pouchdb-find'
import * as PouchSecurity from 'pouchdb-security-helper'

import * as winston from 'winston'

import { defaultConfiguration } from '../../src/config'

import { DatabaseService } from '../../src/services/technical/database.service'

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchFind)
  .plugin(PouchAuth)
  .plugin(PouchSecurity)

describe('DatabaseService', () => {

  let configuration = defaultConfiguration()

  let serverUser = configuration.database.auth

  let databaseService
  let database

  beforeEach(async () => {

    let nullLogger = new winston.Logger()
    databaseService = new DatabaseService(configuration, nullLogger)

    // Create user database
    database = new PouchDB(configuration.database.url + '/_users', { skip_setup: true })

    await database.signUpAdmin('admin', 'password')
    await database.logIn('admin', 'password')

    // Add server admin user
    await database.signUp(serverUser.username, serverUser.password, {
      roles: ['cabasvert:admin'],
    })

    try {
      let security = database.security()
      await security.fetch()
      security.admins.roles.add('cabasvert:admin')
      await security.save()
    } catch (e) {
    }

    // Add a fake user to database
    await database.signUp('john.doe@example.com', 'password', {
      metadata: {
        metadata: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      },
    })

    await database.logOut()
  })

  afterEach(async () => {
    await database.logIn('admin', 'password')

    try {
      let security = database.security()
      await security.fetch()
      security.reset()
      await security.save()
    } catch (e) {
    }

    await database.deleteUser(serverUser.username)

    await database.deleteUser('john.doe@example.com')

    await database.deleteAdmin('admin')
    await database.logOut()
  })

  it('logs properly', async () => {
    await databaseService.logIn()
  })
})
