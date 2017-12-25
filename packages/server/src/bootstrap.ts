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
