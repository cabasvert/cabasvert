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
import * as request from 'supertest'
import * as winston from 'winston'

import { testConfiguration } from '../config-test'
import { User } from '../models/user.model'
import { initializeServer } from '../server'
import { Services } from '../types'
import './user.controller'

type UserWithPassword = User & { password?: string }

interface TokenData {
  hash: string,
  expiryDate: string
}

const fakeUserId = 'john.doe@example.com'
const wrongUserId = 'jane.smith@example.com'
const fakeMetadata = { metadata: { name: 'John Doe', email: fakeUserId } }
const fakeUser = {
  _id: 'org.couchdb.user:' + fakeUserId,
  type: 'user',
  name: fakeUserId,
  roles: [],
  ...fakeMetadata,
  password: 'password',
}

function fakeUserWithToken(tokenData: TokenData) {
  return { ...fakeUser, ...fakeMetadataWithToken(tokenData) }
}

function fakeMetadataWithToken(tokenData: TokenData) {
  return { metadata: { ...fakeMetadata.metadata, 'password-reset-token': tokenData } }
}

describe('UserController', () => {

  let configuration = testConfiguration()
  let baseUrl = configuration.clientApplication.url

  let nullLogger = winston.createLogger({
    transports: [new winston.transports.Console({ silent: true })],
  })

  let databaseServiceMock = {
    initialize: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    changePassword: jest.fn(),
  }

  let tokenServiceMock = {
    generateToken: jest.fn(),
    hashToken: jest.fn(),
  }

  let mailServiceMock = {
    sendMail: jest.fn(),
  }

  let server: http.Server

  beforeEach(async () => {
    jest.resetAllMocks()

    databaseServiceMock.initialize.mockResolvedValue(null)
    databaseServiceMock.logIn.mockResolvedValue(null)
    databaseServiceMock.logOut.mockResolvedValue(null)
    databaseServiceMock.getUser.mockImplementation(() => fakeUser)
    databaseServiceMock.updateUser.mockResolvedValue(true)
    databaseServiceMock.changePassword.mockResolvedValue(true)

    tokenServiceMock.generateToken.mockResolvedValue({ token: 'fake-token', hash: 'fake-hash' })
    tokenServiceMock.hashToken.mockResolvedValue('fake-hash')

    mailServiceMock.sendMail.mockResolvedValue(null)

    // load everything needed to the Container
    let container = new Container()

    container.bind(Services.Config).toConstantValue(configuration)
    container.bind(Services.Logger).toConstantValue(nullLogger)
    container.bind(Services.Database).toConstantValue(databaseServiceMock)
    container.bind(Services.Mail).toConstantValue(mailServiceMock)
    container.bind(Services.Token).toConstantValue(tokenServiceMock)

    server = await initializeServer(Promise.resolve(container))
  })

  afterEach(async () => {
    server.close()
  })

  it('correctly handle valid reset request', async () => {
    await sendRequest(fakeUserId)

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)

    expect(mailServiceMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.stringContaining(fakeUserId),
        text: expect.stringContaining(`${baseUrl}/reset-password/${fakeUserId}/fake-token`),
      }),
    )

    expect(databaseServiceMock.updateUser).toHaveBeenCalledWith(fakeUserId,
      expect.objectContaining({
        metadata: expect.objectContaining({
          'password-reset-token': expect.objectContaining({
            hash: 'fake-hash',
          }),
        }),
      }))
  })

  it('rejects requests for unknown users', async () => {
    databaseServiceMock.getUser.mockResolvedValueOnce(null)

    await sendRequestBadRequest(wrongUserId, { code: 'UNKNOWN_USER', message: 'Unknown user' })

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
  })

  it('rejects requests when database get user fails', async () => {
    databaseServiceMock.getUser.mockRejectedValueOnce(new Error('Database failed'))

    await sendRequestBadRequest(wrongUserId, { code: 'UNKNOWN_USER', message: 'Unknown user' })

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
  })

  it('errors requests if mail sending fails', async () => {
    mailServiceMock.sendMail.mockRejectedValueOnce(new Error('Email sending failed'))

    await sendRequestError(fakeUserId, { code: 'PROCESSING_ERROR', message: 'Email sending failed' })

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
  })

  it('errors requests if database fails', async () => {
    databaseServiceMock.logIn.mockRejectedValueOnce(new Error('Database failed'))

    await sendRequestError(fakeUserId, { code: 'PROCESSING_ERROR', message: 'Database failed' })

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(0)
    expect(mailServiceMock.sendMail).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
  })

  it('correctly handle valid reset confirmation', async () => {
    databaseServiceMock.getUser.mockResolvedValueOnce(
      fakeUserWithToken({
        hash: 'fake-hash',
        expiryDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    await sendConfirm(
      { username: fakeUserId, token: 'fake-token', 'new-password': 'newPassword' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(1)

    expect(databaseServiceMock.changePassword).toHaveBeenCalledWith(fakeUserId, 'newPassword')
  })

  it('rejects confirmations with invalid token', async () => {
    databaseServiceMock.getUser.mockResolvedValueOnce(
      fakeUserWithToken({
        hash: 'fake-hash',
        expiryDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    )
    tokenServiceMock.hashToken.mockResolvedValueOnce('some-other-hash')

    await sendConfirmBadRequest(
      { username: fakeUserId, token: 'invalid-token', 'new-password': 'newPassword' },
      { code: 'INVALID_TOKEN', message: 'Token is invalid' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(1)

    expect(databaseServiceMock.updateUser).toHaveBeenCalledWith(fakeUserId, fakeMetadata)
  })

  it('rejects confirmations with expired token', async () => {
    databaseServiceMock.getUser.mockResolvedValueOnce(
      fakeUserWithToken({
        hash: 'fake-hash',
        expiryDate: new Date().toISOString(),
      }),
    )

    await sendConfirmBadRequest(
      { username: fakeUserId, token: 'invalid-token', 'new-password': 'newPassword' },
      { code: 'EXPIRED_TOKEN', message: 'Token has expired' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(1)

    expect(databaseServiceMock.updateUser).toHaveBeenCalledWith(fakeUserId, fakeMetadata)
  })

  it('rejects confirmations with missing username data', async () => {
    await sendConfirmBadRequest(
      { token: 'invalid-token', 'new-password': 'newPassword' },
      { code: 'MISSING_DATA', message: 'Missing data for password reset' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  it('rejects confirmations with missing token data', async () => {
    await sendConfirmBadRequest(
      { 'username': fakeUserId, 'new-password': 'newPassword' },
      { code: 'MISSING_DATA', message: 'Missing data for password reset' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  it('rejects confirmations with missing new-password data', async () => {
    await sendConfirmBadRequest(
      { username: fakeUserId, token: 'fake-token' },
      { code: 'MISSING_DATA', message: 'Missing data for password reset' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  it('rejects confirmations for unknown users', async () => {
    databaseServiceMock.getUser.mockResolvedValueOnce(null)

    await sendConfirmBadRequest(
      { username: wrongUserId, token: 'fake-token', 'new-password': 'newPassword' },
      { code: 'UNKNOWN_USER', message: 'Unknown user' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  it('rejects confirmations without prior request', async () => {
    await sendConfirmBadRequest(
      { username: fakeUserId, token: 'fake-token', 'new-password': 'newPassword' },
      { code: 'NO_PASSWORD_RESET_REQUEST', message: 'No password reset request done' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(1)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  it('errors confirmations if database fails', async () => {
    databaseServiceMock.logIn.mockRejectedValueOnce(new Error('Database failed'))

    await sendConfirmError(
      { username: fakeUserId, token: 'fake-token', 'new-password': 'newPassword' },
      { code: 'PROCESSING_ERROR', message: 'Database failed' },
    )

    expect(databaseServiceMock.getUser).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.changePassword).toHaveBeenCalledTimes(0)
    expect(databaseServiceMock.updateUser).toHaveBeenCalledTimes(0)
  })

  async function sendRequest(userId: string) {
    await request(server)
      .get('/api/user/request-password-reset/' + userId)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: true })
  }

  async function sendRequestBadRequest(userId: string,
                                       error: { code: string, message: string }) {
    await request(server)
      .get('/api/user/request-password-reset/' + userId)
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(error)
  }

  async function sendRequestError(userId: string,
                                  error: { code: string, message: string }) {
    await request(server)
      .get('/api/user/request-password-reset/' + userId)
      .expect(500)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(error)
  }

  async function sendConfirm(confirmData: any) {

    await request(server)
      .post('/api/user/confirm-password-reset')
      .send(confirmData)
      .expect(200)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect({ ok: true })
  }

  async function sendConfirmBadRequest(confirmData: any,
                                       error: { code: string, message: string }) {

    await request(server)
      .post('/api/user/confirm-password-reset')
      .send(confirmData)
      .expect(400)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(error)
  }

  async function sendConfirmError(confirmData: any,
                                  error: { code: string, message: string }) {
    await request(server)
      .post('/api/user/confirm-password-reset')
      .send(confirmData)
      .expect(500)
      .expect('Content-Type', 'application/json; charset=utf-8')
      .expect(error)
  }
})
