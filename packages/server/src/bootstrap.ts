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

import { Container } from 'inversify'
import { LoggerInstance } from 'winston'
import { Configuration } from './config'

import { DatabaseService } from './services/database.service'
import { logger } from './services/logger'
import { MailService } from './services/mail.service'
import { TokenService } from './services/token.service'

import { Services } from './types'

export async function initializeContainer(configuration: Configuration) {
  let container = new Container()
  container.bind<Configuration>(Services.Config).toConstantValue(configuration)
  container.bind<LoggerInstance>(Services.Logger).toConstantValue(logger)
  container.bind<DatabaseService>(Services.Database).to(DatabaseService).inSingletonScope()
  container.bind<MailService>(Services.Mail).to(MailService).inSingletonScope()
  container.bind<TokenService>(Services.Token).to(TokenService).inSingletonScope()

  return container
}
