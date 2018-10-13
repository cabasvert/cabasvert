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
import { Configuration, locationFromOptions } from '../config'
import { DatabaseBackup } from '../services/business/backup'
import { DatabaseService } from '../services/technical/database.service'
import { Services } from '../types'

@injectable()
export class SetupCommand extends Command {

  constructor(@inject(Services.Logger) private logger: LoggerInstance,
              @inject(Services.Config) private config: Configuration,
              @inject(Services.Database) private database: DatabaseService) {
    super()
  }

  get name(): string {
    return 'setup'
  }

  async execute(args: string[], opts: { [name: string]: any }) {
    let location = locationFromOptions(opts, this.config)

    await this.database.createAdmin(location)
  }

  displayUsage() {
    console.log('    setup                   Setups database')
  }
}
