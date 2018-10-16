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

import { inject, injectable } from 'inversify'

import * as PouchHttp from 'pouchdb-adapter-http'
import * as PouchAuth from 'pouchdb-authentication'
import * as PouchDB from 'pouchdb-core'
import * as PouchFind from 'pouchdb-find'

import { Logger } from 'winston'

import { Configuration, Location } from '../../config'

import { Services } from '../../types'
import Database = PouchDB.Database

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchFind)
  .plugin(PouchAuth)

@injectable()
export class DatabaseService {

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: Logger) {
  }

  async createAdmin(location: Location) {
    let dbUrl = location.database.url + '/_users'
    let database = new PouchDB(dbUrl)

    let auth = location.database.auth
    await database.signUpAdmin(auth.username, auth.password)
  }

  async createDatabase(location: Location, dbName: string, create: boolean) {
    let dbUrl = location.database.url + '/' + dbName
    let database = new PouchDB(dbUrl)

    if (!await this.logIn(location, database)) {
      throw new Error('Can\'t log in database')
    }

    if (create) {
      try {
        await database.info()
      } catch (error) {
        this.logger.error(`Error while infoing database.`, error)
      }
    }

    return database
  }

  private async logIn(location: Location, db: Database<{}>) {
    let user = location.database.auth
    if (!user) return true

    try {
      await db.logIn(user.username, user.password)

      const session = await db.getSession()
      if (session.ok && !!session.userCtx.name) {
        this.logger.info(`Successfully logged user in '${user.username}' in.`)
        return true
      }

      this.logger.error(`Failed to log user '${user.username}' in.`)
    } catch (error) {
      this.logger.error(`Failed to log user '${user.username}' in:`, error)
    }
    return false
  }

  async destroyDatabase(location: Location, dbName: string) {
    let db = await this.createDatabase(location, dbName, false)
    try {
      await db.destroy()
    } catch (error) {
      this.logger.error(`Error while destroying database.`, error)
    }
  }
}
