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
import { Logger } from 'winston'
import { Services } from './types'

@injectable()
export abstract class Command {

  get name(): string {
    throw Error('Not implemented')
  }

  get aliases(): string[] {
    return []
  }

  async execute(args: string[], opts: { [name: string]: any }) {
    throw Error('Not implemented')
  }

  displayUsage() {
  }
}

@injectable()
export class CommandRegistry {

  private byName: { [name: string]: Command } = {}
  private byNameAndAlias: { [name: string]: Command } = {}

  constructor(@inject(Services.Logger) private logger: Logger) {
  }

  register(command: Command) {
    // Register command name and aliases
    this.registerForName(command.name, command, this.byName)
    this.registerForName(command.name, command, this.byNameAndAlias)
    command.aliases.forEach(name => this.registerForName(name, command, this.byNameAndAlias))
  }

  private registerForName(name: string, command: Command, registry: { [name: string]: Command }) {
    if (registry[name] !== undefined) {
      this.logger.error(`Commands with duplicate name or alias: ${name}`)
    }
    registry[name] = command
  }

  getByName(name: string) {
    return this.byNameAndAlias[name]
  }

  sortedCommands() {
    let names = Object.keys(this.byName)
    names.sort()
    return names.map(name => this.byName[name])
  }
}
