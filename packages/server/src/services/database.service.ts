import { inject, injectable } from 'inversify'
import { LoggerInstance } from 'winston'

import { Configuration } from '../config'

import { User, UserMetadata } from '../models/user.model'

import { Services } from '../types'

const PouchDB = require('pouchdb-core')
  .plugin(require('pouchdb-adapter-http'))
  .plugin(require('pouchdb-find'))
  .plugin(require('pouchdb-authentication'))

@injectable()
export class DatabaseService {

  private db: any

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: LoggerInstance) {
    this.db = new PouchDB(this.config.database.url + '/_users', { skip_setup: true })
  }

  async initialize() {
    let user = this.config.database.auth
    await this.loginDatabase(user.username, user.password)
  }

  private loginDatabase(username: string, password: string) {
    return this.db.login(username, password)
      .then(() => {
        return this.db.getSession()
          .then(res => {
            this.logger.info(`Successfully logged user '${username}' in.`)
            this.logger.debug(`Session: ${JSON.stringify(res)}`)
          })
      })
      .catch((error: any) => {
        this.logger.error(`Failed to log user '${username}' in: ${JSON.stringify(error)}`)
      })
  }

  getUser(userId: string): Promise<User> {
    // Can't work yet (cf apache/couchdb#535 fixed in apache/couchdb#627)
    // return this.findUserByEmail(userId)

    // Resort to a get as our username are emails...
    return this.db.getUser(userId)
  }

  updateUser(userId: string, data: { metadata: UserMetadata }): Promise<any> {
    return this.db.putUser(userId, data)
  }

  changePassword(userId: string, password: string): Promise<boolean> {
    return this.db.changePassword(userId, password)
      .then(res => res.ok)
  }

  // Can't work yet (cf apache/couchdb#535 fixed in apache/couchdb#627)
  /* istanbul ignore next */
  private findUserByEmail(email: string) {
    let query = {
      selector: {
        type: 'user',
        metadata: {
          email: email,
        },
      },
      limit: 1,
    }

    return this.db.find(query)
      .then(result => {
        if (!result.docs || result.docs.length === 0) return null
        return result.docs[0]
      })
  }
}
