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
import { Container } from 'inversify'
import 'jasmine'
import 'reflect-metadata'
import * as winston from 'winston'
import { LoggerInstance } from 'winston'

import { Configuration, defaultConfiguration } from '../../src/config'

import '../../src/controllers/user.controller'
import { initializeServer } from '../../src/server'
import { DatabaseService } from '../../src/services/database.service'
import { MailService } from '../../src/services/mail.service'
import { TokenService } from '../../src/services/token.service'
import { Services } from '../../src/types'

const request = require('supertest')

class DatabaseServiceMock extends DatabaseService {

  private error: any

  reset() {
    this.error = null
  }

  async status(): Promise<{ ok: boolean, error?: any}> {
    if (this.error) return { ok: false, error: this.error }
    else return { ok: true }
  }

  setFailing(error: any) {
    this.error = error
  }
}

class TokenServiceMock extends TokenService {
}

class MailServiceMock extends MailService {

  private error: any

  reset() {
    this.error = null
  }

  async status(): Promise<{ ok: boolean, error?: any }> {
    if (this.error) return { ok: false, error: this.error }
    else return { ok: true }
  }

  setFailing(error: any) {
    this.error = error
  }
}

describe('StatusController', () => {

  let configuration = defaultConfiguration()

  let nullLogger = new winston.Logger({})
  let databaseServiceMock = new DatabaseServiceMock(configuration, nullLogger)
  let tokenServiceMock = new TokenServiceMock()
  let mailServiceMock = new MailServiceMock(configuration, nullLogger)

  let server: http.Server

  beforeEach(async () => {
    databaseServiceMock.reset()
    mailServiceMock.reset()

    // load everything needed to the Container
    let container = new Container()

    container.bind<Configuration>(Services.Config).toConstantValue(configuration)
    container.bind<LoggerInstance>(Services.Logger).toConstantValue(nullLogger)
    container.bind<DatabaseService>(Services.Database).toConstantValue(databaseServiceMock)
    container.bind<MailService>(Services.Mail).toConstantValue(mailServiceMock)
    container.bind<TokenService>(Services.Token).toConstantValue(tokenServiceMock)

    server = await initializeServer(Promise.resolve(container))
  })

  afterEach(async () => {
    server.close()
  })

  it('correctly reports OK status when no errors', async () => {
    await request(server)
      .get('/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: true, database: { ok: true }, mail: { ok: true } })
  })

  it('correctly reports error for database problems', async () => {
    databaseServiceMock.setFailing('error')

    await request(server)
      .get('/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: false, database: { ok: false, error: 'error' }, mail: { ok: true } })
  })

  it('correctly reports error for mail problems', async () => {
    mailServiceMock.setFailing('error')

    await request(server)
      .get('/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: false, database: { ok: true }, mail: { ok: false, error: 'error' } })
  })
})
