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

import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { LoggerInstance } from 'winston'

import { Configuration } from '../config'
import { Services } from '../types'

@injectable()
export class MailService {

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: LoggerInstance) {
  }

  async status(): Promise<{ ok: boolean, error?: any }> {
    let smtpTransport = this.createTransport()

    try {
      await smtpTransport.verify()
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error }
    } finally {
      smtpTransport.close()
    }
  }

  async sendMail(mail: Mail.Options) {
    let smtpTransport = this.createTransport()

    try {
      return await smtpTransport.sendMail(mail)
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`)
      throw error
    } finally {
      smtpTransport.close()
    }
  }

  private createTransport() {
    let connection = this.config.smtpConnection

    return createTransport({
      host: connection.host,
      port: connection.port,
      secure: connection.secure,
      auth: {
        user: connection.auth.username,
        pass: connection.auth.password,
      },
    })
  }
}
