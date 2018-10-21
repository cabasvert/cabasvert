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

import { Container, injectable } from 'inversify'
import * as parseCli from 'minimist'
import 'reflect-metadata'
import { Logger } from 'winston'

import { initializeContainer } from './bootstrap'
import { CommandRegistry } from './command'
import { Configuration, HOME_DIRECTORY, parseJsonFile } from './config'
import { Services } from './types'

export class CabasVertTools {

  private container: Container
  private logger: Logger
  private registry: CommandRegistry

  constructor(private configuration: Configuration) {
    this.container = initializeContainer(configuration)
    this.logger = this.container.get(Services.Logger)
    this.registry = this.container.get(Services.CommandRegistry)
  }

  static parseAndExecute(argv: any) {
    if (argv[0].endsWith('/node')) argv = argv.slice(2)
    else if (argv[0].endsWith('/cvt')) argv = argv.slice(1)

    let parsed = parseCli(argv, {
      '--': true,
      'alias': {
        'db-name': ['d'],
        'help': ['h'],
        'location': ['l'],
      },
      'default': {},
    })
    let args = parsed._
    delete parsed._
    let opts = parsed

    let configPath = argv['config']
    let configuration =
      configPath === null ? null : parseJsonFile<Configuration>(configPath)
        || parseJsonFile<Configuration>(HOME_DIRECTORY + '/.cabasvertrc.json')

    let tools = new CabasVertTools(configuration)
    tools.execute(args, opts)
  }

  async execute(args: string[], opts: { [name: string]: any }) {
    if (args.length === 0) {
      if (!opts['help']) {
        this.logger.error('No command name')
      }
      this.displayUsage()
      return
    }

    let commandName = args[0]
    let command = this.registry.getByName(commandName)
    if (command === undefined) {
      this.logger.error(`Invalid command name: ${commandName}`)
      this.displayUsage()
      return
    }

    try {
      await command.execute(args.slice(1), opts)
    } catch (error) {
      if (error) this.logger.error(error)
      if (error.stack) console.log(error.stack)
    }
  }

  private displayUsage() {
    console.log('Usage: cvt [OPTION]... COMMAND')

    console.log()
    console.log('Commands:')
    this.registry.sortedCommands().forEach(command => {
      command.displayUsage()
    })

    console.log()
    console.log('Common options:')
    console.log('    -l, --location=NAME      Specify the server location')
    console.log('    -H, --host=URL           Specify the database host')
    console.log('    --username=...           Specify an admin username')
    console.log('    --password=...           Specify an admin password')
    console.log('    -d, --db-name=NAME       Specify the database name')
    console.log('    -h, --help               Shows this help message')
    console.log()
    console.log('Server locations:')
    console.log('    You can have location shortcuts in a .cabasvertrc.json file in your')
    console.log('    home directory. It has the following format:')
    console.log()
    console.log(JSON.stringify({
        'defaultLocation': 'local',
        'locations': {
          'local': {
            'name': 'local',
            'database': {
              'url': 'http://localhost:5984',
            },
          },
          'prod': {
            'name': 'prod',
            'database': {
              'url': 'https://my-database.com',
              'auth': {
                'username': 'my-username',
                'password': 'my-password',
              },
            },
          },
        },
      },
      null,
      '  ',
    ))
  }
}
