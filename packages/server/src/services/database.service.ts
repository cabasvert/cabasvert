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

import { LoggerInstance } from 'winston'

import { Configuration } from '../config'

import { User, UserMetadata } from '../models/user.model'

import { Services } from '../types'

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchFind)
  .plugin(PouchAuth)

@injectable()
export class DatabaseService {

  private db: any

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: LoggerInstance) {
    this.db = new PouchDB(this.config.database.url + '/_users', { skip_setup: true })
  }

  async initialize() {
    await this.logIn()
    await this.logOut()
  }

  async logIn() {
    let user = this.config.database.auth
    await this.db.logIn(user.username, user.password)
      .then(() => {
        return this.db.getSession()
          .then(res => {
            this.logger.info(`Successfully logged user '${user.username}' in.`)
            this.logger.debug(`Session: ${JSON.stringify(res)}`)
          })
      })
      .catch((error: any) => {
        this.logger.error(`Failed to log user '${user.username}' in: ${JSON.stringify(error)}`)
      })
  }

  async logOut() {
    await this.db.logOut()
      .catch((error: any) => {
        this.logger.error(`Failed to log out: ${JSON.stringify(error)}`)
      })
  }

  getUser(userId: string): Promise<User> {
    // Can't work yet (cf apache/couchdb#535 fixed in apache/couchdb#627)
    // return this.findUserByEmail(userId)

    // Resort to a get as our username are emails...
    return this.db.getUser(userId)
  }

  updateUser(userId: string, data: { metadata: UserMetadata }): Promise<any> {
    return this.db.putUser(userId, { metadata: data })
  }

  changePassword(userId: string, password: string): Promise<boolean> {
    return this.db.changePassword(userId, password)
      .then(res => res.ok)
  }

  // Can't work yet (cf apache/couchdb#535 fixed in apache/couchdb#627)
  /* istanbul ignore next */
  private findUserByEmail(email: string) {
    let query = {
      selector: {
        type: 'user',
        metadata: {
          email: email,
        },
      },
      limit: 1,
    }

    return this.db.find(query)
      .then(result => {
        if (!result.docs || result.docs.length === 0) return null
        return result.docs[0]
      })
  }
}
