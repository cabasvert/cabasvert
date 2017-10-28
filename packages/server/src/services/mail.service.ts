import { inject, injectable } from 'inversify'

import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { LoggerInstance } from 'winston'

import { SMTP_CONNECTION_DATA } from '../config'
import { Services } from '../types'

@injectable()
export class MailService {

  constructor(@inject(Services.Logger) private logger: LoggerInstance) {
  }

  async sendMail(mail: Mail.Options) {
    let connectionData = SMTP_CONNECTION_DATA

    mail['from'] = `Cabas Vert <${connectionData.auth.user}>`

    let smtpTransport = createTransport(connectionData)

    try {
      return await smtpTransport.sendMail(mail)
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`)
    } finally {
      smtpTransport.close()
    }
  }
}
