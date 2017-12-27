import * as express from 'express'
import { inject } from 'inversify'
import { controller, httpGet, httpPost, request, requestParam, response } from 'inversify-express-utils'
import { LoggerInstance } from 'winston'
import { Configuration } from '../config'

import { UserMetadata } from '../models/user.model'
import { DatabaseService } from '../services/database.service'

import { MailService } from '../services/mail.service'
import { TokenService } from '../services/token.service'
import { Services } from '../types'

const PASSWORD_RESET_TOKEN_KEY = 'password-reset-token'
const EXPIRY_TIME = 24 // hours

@controller('/user')
export class UserController {

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: LoggerInstance,
              @inject(Services.Database) private userDatabase: DatabaseService,
              @inject(Services.Mail) private mailSender: MailService,
              @inject(Services.Token) private tokenGenerator: TokenService) {
  }

  // GET /user/request-password-reset/:userId
  // Request a password reset
  @httpGet('/request-password-reset/:userId')
  async requestPasswordReset(@requestParam('userId') userId: string,
                             @response() res: express.Response): Promise<void> {

    this.logger.debug(`Received request for password reset for user '${userId}'`)

    try {
      await this.userDatabase.logIn()

      let doc = await this.userDatabase.getUser(userId)
      if (!doc) throw new Error('Unknown user')

      let metadata: UserMetadata = doc.metadata

      let { token, hash } = await this.tokenGenerator.generateToken()
      let expiryDate = new Date(new Date().getTime() + EXPIRY_TIME * 60 * 60 * 1000).toISOString()

      // Send an email with token
      await this.sendPasswordResetMail(metadata, userId, token)
      this.logger.debug(`Sent email to '${metadata.email}' for '${userId}' to confirm password reset`)

      // Store hash in database along to userId and expiryDate
      metadata[PASSWORD_RESET_TOKEN_KEY] = { hash, expiryDate }
      await this.userDatabase.updateUser(userId, { metadata })

      res.json({ ok: true })
    } catch (error) {
      res.json({ ok: false, error: error.message })
    } finally {
      await this.userDatabase.logOut()
    }
  }

  // POST /user/confirm-password-reset/:userId
  // Body is of the form { token, new-password }
  // Confirm a password reset
  @httpPost('/confirm-password-reset/:userId')
  async confirmPasswordReset(@requestParam('userId') userId: string,
                             @request() req: express.Request,
                             @response() res: express.Response): Promise<void> {

    let body = req.body
    let token = body['token']
    let newPassword = body['new-password']

    this.logger.debug(`Received confirmation for password reset for user '${userId}'`)

    try {
      await this.userDatabase.logIn()

      let doc = await this.userDatabase.getUser(userId)
      if (!doc) throw new Error('Unknown user')

      if (!doc.metadata || !doc.metadata[PASSWORD_RESET_TOKEN_KEY])
        throw new Error('No password reset request done')

      // Get expected hash and expiryDate in database based on userId
      let tokenData = doc.metadata[PASSWORD_RESET_TOKEN_KEY]
      let expectedHash = tokenData.hash
      let expiryDate = new Date(tokenData.expiryDate)

      let hash = await this.tokenGenerator.hashToken(token)

      if (expiryDate < new Date()) throw new Error('Token has expired')
      if (expectedHash !== hash) throw new Error('Token is invalid')

      // Update the password
      let ok = await this.userDatabase.changePassword(userId, newPassword)
      this.logger.debug(`Updated password for '${userId}'`)

      // Remove hash in database along to userId and expiryDate
      /* istanbul ignore else */
      if (ok) {
        let metadata: UserMetadata = doc.metadata
        /* istanbul ignore else */
        if (metadata) delete metadata['password-reset-token']
        await this.userDatabase.updateUser(userId, { metadata })
      }

      res.json({ ok })
    } catch (error) {
      res.json({ ok: false, error: error.message })
    } finally {
      await this.userDatabase.logOut()
    }
  }

  makeClientAppConfirmFormUrl(userId: string, token: string) {
    let baseUrl = this.config.clientApplication.url
    return `${baseUrl}/confirm-password-reset?userId=${userId}&token=${token}`
  }

  sendPasswordResetMail(metadata: UserMetadata, userId: string, token: string) {
    return this.mailSender.sendMail({
      to: `${metadata.name} <${metadata.email}>`,
      subject: `Cabas Vert: Password reset for ${metadata.name}`,
      text: `Dear ${metadata.name},

You requested a password reset.
You can confirm your request and change your password by visiting the following link:

${this.makeClientAppConfirmFormUrl(userId, token)}

Best regards,
the Cabas Vert server.`,
    })
  }
}
