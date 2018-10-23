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

import * as nodemailer from 'nodemailer'
import 'reflect-metadata'
import * as winston from 'winston'
import { testConfiguration } from '../config-test'

import { MailService } from './mail.service'

jest.mock('nodemailer')

describe('MailService', () => {

  let configuration = testConfiguration()
  let nullLogger: winston.Logger

  let transport: any

  let mailService: MailService

  beforeEach(() => {
    transport = { close: jest.fn(), sendMail: jest.fn(), verify: jest.fn() };
    (nodemailer.createTransport as any).mockReturnValue(transport)

    nullLogger = winston.createLogger({
      transports: [new winston.transports.Console({ silent: true })],
    })
    mailService = new MailService(configuration, nullLogger)
  })

  afterEach(() => {
    (nodemailer.createTransport as any).mockReset()
  })

  it('sends mail', async () => {
    let mail = {
      from: 'source@test.com',
      to: 'target@test.com',
      subject: 'Test subject',
      text: 'Test text',
    }

    transport.sendMail.mockReturnValue(Promise.resolve())

    await mailService.sendMail(mail)

    expect(nodemailer.createTransport).toHaveBeenCalledWith(configuration.mail.smtpConnection)
    expect(transport.sendMail).toHaveBeenCalledWith(mail)
    expect(transport.close).toHaveBeenCalled()
  })

  it('closes transport if sending mail fails', async () => {
    let mail = {
      from: 'source@test.com',
      to: 'target@test.com',
      subject: 'Test subject',
      text: 'Test text',
    }

    transport.sendMail.mockReturnValue(Promise.reject(new Error('error')))

    let errorCaught
    try {
      await mailService.sendMail(mail)
    } catch (error) {
      errorCaught = error
    }

    expect(errorCaught).toMatchObject({
      name: 'Error',
      message: 'error',
    })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(configuration.mail.smtpConnection)
    expect(transport.sendMail).toHaveBeenCalledWith(mail)
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports OK status', async () => {
    transport.verify.mockResolvedValue(true)

    expect(await mailService.status()).toEqual({ ok: true })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(configuration.mail.smtpConnection)
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports KO status if verify reports problem', async () => {
    transport.verify.mockResolvedValue(false)

    expect(await mailService.status()).toEqual({ ok: false })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(configuration.mail.smtpConnection)
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })

  it('reports KO status if verify fails', async () => {
    transport.verify.mockRejectedValue(new Error('error'))

    expect(await mailService.status()).toEqual({
      ok: false,
      error: jasmine.objectContaining({
        name: 'Error',
        message: 'error',
      }),
    })
    expect(nodemailer.createTransport).toHaveBeenCalledWith(configuration.mail.smtpConnection)
    expect(transport.verify).toHaveBeenCalled()
    expect(transport.close).toHaveBeenCalled()
  })
})
