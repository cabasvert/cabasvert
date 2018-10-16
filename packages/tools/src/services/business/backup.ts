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

import { readFile, writeFile } from 'mz/fs'
import { Logger } from 'winston'
import { Location } from '../../config'
import { Services } from '../../types'
import { DatabaseService } from '../technical/database.service'

@injectable()
export class DatabaseBackup {

  constructor(@inject(Services.Logger) private logger: Logger,
              @inject(Services.Database) private database: DatabaseService) {
  }

  async saveBackup(location: Location, dbName: string) {
    let db = await this.database.createDatabase(location, dbName, false)
    let docs = await db.allDocs({ include_docs: true })

    let today = new Date().toISOString()
    await writeFile(`backup-${dbName}-${location.name}-${today}.json`, JSON.stringify(docs, null, '  '))
  }

  async restoreBackup(location: Location, dbName: string, file: string) {
    let backup: PouchDB.Core.AllDocsResponse<any> = JSON.parse((await readFile(file)).toString())
    let docs = backup.rows.map(r => r.doc)

    // Destroy and recreate database
    await this.database.destroyDatabase(location, dbName)

    let db = await this.database.createDatabase(location, dbName, true)
    await db.bulkDocs(docs, { new_edits: false })
  }
}
