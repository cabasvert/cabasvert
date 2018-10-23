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
import 'reflect-metadata'
import * as winston from 'winston'

import { testConfiguration } from '../config-test'
import { initializeServer } from '../server'
import { Services } from '../types'
import './user.controller'

const request = require('supertest')

describe('StatusController', () => {

  let configuration = testConfiguration()

  let nullLogger = winston.createLogger({
    transports: [new winston.transports.Console({ silent: true })],
  })

  let databaseServiceMock = {
    initialize: jest.fn().mockResolvedValue(null),
    status: jest.fn().mockResolvedValue({ ok: true }),
  }

  let mailServiceMock = {
    status: jest.fn().mockResolvedValue({ ok: true }),
  }

  let server: http.Server

  beforeEach(async () => {
    // load everything needed to the Container
    let container = new Container()

    container.bind(Services.Config).toConstantValue({})
    container.bind(Services.Logger).toConstantValue(nullLogger)
    container.bind(Services.Database).toConstantValue(databaseServiceMock)
    container.bind(Services.Mail).toConstantValue(mailServiceMock)
    container.bind(Services.Token).toConstantValue({})

    server = await initializeServer(Promise.resolve(container))
  })

  afterEach(async () => {
    server.close()
  })

  it('correctly reports OK status when no errors', async () => {
    await request(server)
      .get('/api/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: true, database: { ok: true }, mail: { ok: true } })
  })

  it('correctly reports error for database problems', async () => {
    databaseServiceMock.status.mockResolvedValueOnce({ ok: false, error: 'error' })

    await request(server)
      .get('/api/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: false, database: { ok: false, error: 'error' }, mail: { ok: true } })
  })

  it('correctly reports error for mail problems', async () => {
    mailServiceMock.status.mockResolvedValueOnce({ ok: false, error: 'error' })

    await request(server)
      .get('/api/status/check')
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: false, database: { ok: true }, mail: { ok: false, error: 'error' } })
  })
})
