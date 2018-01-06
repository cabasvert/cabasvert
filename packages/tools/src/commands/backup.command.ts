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
import { LoggerInstance } from 'winston'
import { Command } from '../command'
import { Configuration } from '../config'
import { DatabaseBackup } from '../services/business/backup'
import { DatabaseService } from '../services/technical/database.service'
import { Services } from '../types'

@injectable()
export class BackupCommand extends Command {

  constructor(@inject(Services.Logger) private logger: LoggerInstance,
              @inject(Services.Config) private config: Configuration,
              @inject(Services.Database) private database: DatabaseService,
              @inject(Services.Backup) private backup: DatabaseBackup) {
    super()
  }

  get name(): string {
    return 'backup'
  }

  async execute(args: string[], opts: { [name: string]: any }) {
    let locationName = opts['location'] || this.config.defaultLocation
    let location = this.config.locations[locationName]

    let action = args[0]
    if (!action) throw new Error('Argument action is not set')

    let dbName = opts['db-name']
    if (!dbName) throw new Error('Database name is not set (--db-name)')

    if (action === 'save') {
      await this.backup.saveBackup(location, dbName)
    } else if (action === 'restore') {
      let file = args[1]
      if (!file) throw new Error('Argument file is not set')

      await this.backup.restoreBackup(location, dbName, file)
    }
  }

  displayUsage() {
    console.log('    backup save             Write a backup of database to file')
    console.log('    backup restore <file>   Restores a backup of database from file')
  }
}
