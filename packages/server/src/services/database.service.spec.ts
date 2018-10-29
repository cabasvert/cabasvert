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

import * as PouchDB from 'pouchdb-core'

import 'reflect-metadata'
import * as winston from 'winston'
import { testConfiguration } from '../config-test'

import { DatabaseService } from './database.service'

jest.mock('pouchdb-core', () => {
  const mockDatabase = {
    logIn: jest.fn(),
    logOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    find: jest.fn(),
    putUser: jest.fn(),
    changePassword: jest.fn(),
  }
  const mockPouchDB: any = jest.fn(() => mockDatabase)
  mockPouchDB.plugin = jest.fn(() => mockPouchDB)
  return mockPouchDB
})

describe('DatabaseService', () => {

  let configuration = testConfiguration()

  let url = configuration.database.url
  let auth = configuration.database.auth

  let nullLogger: winston.Logger
  let databaseService: DatabaseService

  let mockPouchDB
  let mockDatabase

  const fakeUser = {
    name: 'fake@mail.com',
    metadata: {
      email: 'fake@mail.com',
    },
  }

  beforeEach(async () => {
    nullLogger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })],
    })
    databaseService = new DatabaseService(configuration, nullLogger)

    mockPouchDB = (PouchDB as any)
    expect(mockPouchDB).toHaveBeenCalledTimes(1)
    expect(mockPouchDB).toHaveBeenCalledWith(url + '/_users', { skip_setup: true })
    mockDatabase = mockPouchDB.mock.results[0].value

    mockDatabase.logIn.mockResolvedValue(true)
    mockDatabase.logOut.mockResolvedValue(true)
    mockDatabase.getSession.mockResolvedValue({ ok: true, userCtx: { name: auth.username } })
    mockDatabase.getUser.mockResolvedValue(fakeUser)
    mockDatabase.find.mockResolvedValue({ docs: [fakeUser] })
    mockDatabase.putUser.mockResolvedValue({ ok: true })
    mockDatabase.changePassword.mockResolvedValue({ ok: true })
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  it('initializes properly', async () => {
    await databaseService.initialize()

    expect(mockDatabase.logIn).toHaveBeenCalled()
    expect(mockDatabase.logOut).toHaveBeenCalled()
  })

  it('can\'t initialize properly if login fails', async () => {
    mockDatabase.logIn.mockRejectedValueOnce(new Error())

    let caughtError
    try {
      await databaseService.initialize()
    } catch (error) {
      caughtError = error
    }
    expect(caughtError).toBeDefined()

    expect(mockDatabase.logIn).toHaveBeenCalled()
  })

  it('initializes properly even if logout fails', async () => {
    mockDatabase.logOut.mockRejectedValueOnce(new Error())

    let caughtError
    try {
      await databaseService.initialize()
    } catch (error) {
      caughtError = error
    }
    expect(caughtError).toBeUndefined()

    expect(mockDatabase.logIn).toHaveBeenCalled()
    expect(mockDatabase.logOut).toHaveBeenCalled()
  })

  it('can retrieve users by their email', async () => {
    let email = 'john.doe@example.com'
    let user = await databaseService.getUser(email)

    expect(user).toMatchObject(fakeUser)
    expect(mockDatabase.find).toHaveBeenCalledWith({
      selector: {
        type: 'user',
        metadata: { email: email },
      },
    })
    expect(mockDatabase.getUser).toHaveBeenCalledTimes(0)
  })

  it('can retrieve users by their id', async () => {
    mockDatabase.find.mockResolvedValueOnce({ docs: [] })

    let email = 'john.doe@example.com'
    let user = await databaseService.getUser(email)

    expect(user).toMatchObject(fakeUser)
    expect(mockDatabase.find).toHaveBeenCalledWith({
      selector: {
        type: 'user',
        metadata: { email: email },
      },
    })
    expect(mockDatabase.getUser).toHaveBeenCalledWith(email)
  })

  it('returns null if user is not found', async () => {
    mockDatabase.find.mockResolvedValueOnce({ docs: [] })
    mockDatabase.getUser.mockResolvedValueOnce(null)

    expect(await databaseService.getUser('jane.smith@me.com')).toBeNull()
  })

  it('can update user metadata', async () => {
    expect(
      await databaseService.updateUser('john.doe@example.com', {
        metadata: {
          name: 'metadata',
          email: 'john.doe@example.com',
        },
      }),
    ).toEqual(true)

    expect(mockDatabase.putUser).toHaveBeenCalledWith('john.doe@example.com', {
      metadata: {
        metadata: {
          name: 'metadata',
          email: 'john.doe@example.com',
        },
      },
    })
  })

  it('can change user password', async () => {
    expect(
      await databaseService.changePassword('john.doe@example.com', 'newPassword'),
    ).toEqual(true)

    expect(mockDatabase.changePassword).toHaveBeenCalledWith('john.doe@example.com', 'newPassword')
  })

  it('reports OK status', async () => {
    expect(await databaseService.status()).toEqual({ ok: true })

    expect(mockDatabase.logIn).toHaveBeenCalled()
    expect(mockDatabase.getSession).toHaveBeenCalled()
    expect(mockDatabase.logOut).toHaveBeenCalled()
  })

  it('reports KO status if login fails', async () => {
    mockDatabase.logIn.mockRejectedValueOnce('error')

    expect(await databaseService.status()).toEqual({ ok: false, error: 'error' })
  })
})
