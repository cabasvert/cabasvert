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
import { interfaces } from 'inversify/dts/interfaces/interfaces'
import { Logger } from 'winston'
import { Command, CommandRegistry } from './command'

import { BackupCommand } from './commands/backup.command'
import { GenerateCommand } from './commands/generate.command'
import { SetupCommand } from './commands/setup.command'

import { Configuration } from './config'
import { DatabaseBackup } from './services/business/backup'
import { DatabaseGenerator } from './services/business/generator'
import { DatabaseService } from './services/technical/database.service'
import { logger } from './services/technical/logger'

import { Services } from './types'

export const CommandTypes: interfaces.Newable<Command>[] = [
  BackupCommand,
  SetupCommand,
  GenerateCommand,
]

export function initializeContainer(configuration: Configuration) {
  let container = new Container()
  container.bind<Configuration>(Services.Config).toConstantValue(configuration)
  container.bind<Logger>(Services.Logger).toConstantValue(logger)
  container.bind<DatabaseService>(Services.Database).to(DatabaseService).inSingletonScope()
  container.bind<CommandRegistry>(Services.CommandRegistry).to(CommandRegistry).inSingletonScope()

  container.bind<DatabaseBackup>(Services.Backup).to(DatabaseBackup).inSingletonScope()
  container.bind<DatabaseGenerator>(Services.Generator).to(DatabaseGenerator).inSingletonScope()

  CommandTypes.forEach(command => registerCommand(container, command))

  return container
}

function registerCommand<T extends Command>(container: Container, commandType: interfaces.Newable<T>) {
  container.bind<T>(commandType).to(commandType).inSingletonScope()

  container.get<CommandRegistry>(Services.CommandRegistry)
    .register(container.get<Command>(commandType))
}
