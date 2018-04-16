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

import * as express from 'express'
import { inject } from 'inversify'
import { controller, httpGet, response } from 'inversify-express-utils'
import { LoggerInstance } from 'winston'
import { Configuration } from '../config'
import { DatabaseService } from '../services/database.service'

import { MailService } from '../services/mail.service'
import { Services } from '../types'

@controller('/status')
export class StatusController {

  constructor(@inject(Services.Config) private config: Configuration,
              @inject(Services.Logger) private logger: LoggerInstance,
              @inject(Services.Database) private userDatabase: DatabaseService,
              @inject(Services.Mail) private mailSender: MailService) {
  }

  // GET /status/check
  // Checks the status of the server
  @httpGet('/check')
  async get(@response() res: express.Response): Promise<void> {

    let databaseStatus = await this.userDatabase.status()
    let mailStatus = await this.mailSender.status()

    let allStatuses: { ok: boolean, error?: any }[] = [databaseStatus, mailStatus]

    res.json({
      ok: allStatuses.every(s => s.ok),
      database: databaseStatus,
      mail: mailStatus,
    })
  }
}
