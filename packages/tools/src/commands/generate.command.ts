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
import { DatabaseGenerator } from '../services/business/generator'
import { DatabaseService } from '../services/technical/database.service'
import { Services } from '../types'

@injectable()
export class GenerateCommand extends Command {

  constructor(@inject(Services.Logger) private logger: LoggerInstance,
              @inject(Services.Config) private config: Configuration,
              @inject(Services.Database) private database: DatabaseService,
              @inject(Services.Generator) private generator: DatabaseGenerator,
              @inject(Services.Backup) private backup: DatabaseBackup) {
    super()
  }

  get name(): string {
    return 'generate'
  }

  async execute(args: string[], opts: { [name: string]: any }) {
    let locationName = opts['location'] || this.config.defaultLocation
    let location = this.config.locations[locationName]

    let dbName = opts['db-name']
    if (!dbName) throw new Error('Database name is not set (--db-name)')

    let generated = await this.generator.generate()

    // Make a backup of the database
    await this.backup.saveBackup(location, dbName)

    // Destroy database
    await this.database.destroyDatabase(location, dbName)

    let db = await this.database.createDatabase(location, dbName, true)
    await db.bulkDocs(generated)
  }

  displayUsage() {
    console.log('    generate                Generates a randomized database')
  }
}
