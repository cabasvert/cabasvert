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
              @inject(Services.Logger) private logger: Logger) {
    this.db = new PouchDB(this.config.database.url + '/_users', { skip_setup: true })
  }

  async initialize() {
    await this.logIn()
    await this.logOut()
  }

  async status(): Promise<{ ok: boolean, error?: any }> {
    let user = this.config.database.auth
    try {
      await this.db.logIn(user.username, user.password)
      let session = await this.db.getSession()
      await this.db.logOut()

      return { ok: session.ok && session.userCtx.name != null }
    } catch (error) {
      let serializableError = JSON.parse(JSON.stringify(error))
      return { ok: false, error: serializableError }
    }
  }

  async logIn() {
    let { username, password } = this.config.database.auth

    try {
      await this.db.logIn(username, password)
      const res = await this.db.getSession()

      this.logger.info(`Successfully logged user '${username}' in.`)
      this.logger.debug(`Session: ${JSON.stringify(res)}`)
    } catch (error) {
      this.logger.error(`Failed to log user '${username}' in: ${JSON.stringify(error)}`)
      throw error
    }
  }

  async logOut() {
    try {
      await this.db.logOut()
    } catch (error) /* istanbul ignore next */ {
      this.logger.error(`Failed to log out: ${JSON.stringify(error)}`)
    }
  }

  async getUser(userId: string): Promise<User> {
    let user = await this.findUserByEmail(userId)

    // Resort to a get as our username are emails...
    return user ? user : await this.db.getUser(userId)
  }

  private async findUserByEmail(email: string) {
    let query = {
      selector: {
        type: 'user',
        metadata: { email: email },
      },
    }

    try {
      const result = await this.db.find(query)
      if (!result.docs || result.docs.length !== 1) return null
      return result.docs[0]
    } catch (error) /* istanbul ignore next */ {
      // This is only for CouchDB pre-2.2
      return null
    }
  }

  async updateUser(userId: string, data: { metadata: UserMetadata }): Promise<any> {
    const { ok } = await this.db.putUser(userId, { metadata: data })
    return ok
  }

  async changePassword(userId: string, password: string): Promise<boolean> {
    const { ok } = await this.db.changePassword(userId, password)
    return ok
  }
}
