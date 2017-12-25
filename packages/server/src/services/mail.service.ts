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

  async sendMail(mail: Mail.Options) {
    let connection = this.config.smtpConnection

    mail['from'] = `Cabas Vert <${connection.auth.username}>`

    let smtpTransport = createTransport({
      host: connection.host,
      port: connection.port,
      secure: connection.secure,
      auth: {
        user: connection.auth.username,
        pass: connection.auth.password,
      },
    })

    try {
      return await smtpTransport.sendMail(mail)
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`)
    } finally {
      smtpTransport.close()
    }
  }
}
