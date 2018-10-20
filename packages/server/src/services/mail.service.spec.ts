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
import { createTransport } from 'nodemailer'
import * as winston from 'winston'

import * as mockery from 'mockery'

import { MailService } from './mail.service'
import { testConfiguration } from '../config.test'

describe('MailService', () => {

  let configuration = testConfiguration()
  let nullLogger: winston.Logger

  let nodemailer
  let transport

  let mailService: MailService

  beforeAll(() => {
    mockery.enable({ warnOnUnregistered: false })
  })

  beforeEach(async () => {
    nodemailer = jasmine.createSpyObj(['createTransport'])
    transport = jasmine.createSpyObj(['close', 'sendMail', 'verify'])
    nodemailer.createTransport.withArgs(configuration.mail.smtpConnection).and.returnValue(transport)

    mockery.registerMock('nodemailer', nodemailer)

    nullLogger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })],
    })
    mailService = new MailService(configuration, nullLogger)
  })

  afterEach(() => {
    mockery.deregisterAll()
  })

  afterAll(() => {
    mockery.disable()
  })

  it('sends mail', async () => {
    let mail = {
      from: 'source@test.com',
      to: 'target@test.com',
      subject: 'Test subject',
      text: 'Test text',
    }

    transport.sendMail.withArgs(mail).and.returnValue(Promise.resolve())

    await mailService.sendMail(mail)

    expect(nodemailer.createTransport).toHaveBeenCalled()
    expect(transport.sendMail).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('closes transport if sending mail fails', async () => {
    let mail = {
      from: 'source@test.com',
      to: 'target@test.com',
      subject: 'Test subject',
      text: 'Test text',
    }

    transport.sendMail.withArgs(mail).and.returnValue(Promise.reject(new Error('error')))

    let errorCaught
    try {
      await mailService.sendMail(mail)
    } catch (error) {
      errorCaught = error
    }

    expect(errorCaught).toEqual(jasmine.objectContaining({
      name: 'Error',
      message: 'error',
    }))
    expect(nodemailer.createTransport).toHaveBeenCalled()
    expect(transport.sendMail).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports OK status', async () => {
    transport.verify.withArgs().and.returnValue(Promise.resolve(true))

    expect(await mailService.status()).toEqual({ ok: true })
    expect(nodemailer.createTransport).toHaveBeenCalled()
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports KO status if verify reports problem', async () => {
    transport.verify.withArgs().and.returnValue(Promise.resolve(false))

    expect(await mailService.status()).toEqual({ ok: false })
    expect(nodemailer.createTransport).toHaveBeenCalled()
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports KO status if verify fails', async () => {
    transport.verify.withArgs().and.returnValue(Promise.reject(new Error('error')))

    expect(await mailService.status()).toEqual({
      ok: false,
      error: jasmine.objectContaining({
        name: 'Error',
        message: 'error',
      }),
    })
    expect(nodemailer.createTransport).toHaveBeenCalled()
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })
})
