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

import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as express from 'express'
import * as helmet from 'helmet'
import * as http from 'http'

import { Container } from 'inversify'
import { InversifyExpressServer } from 'inversify-express-utils'
import * as morgan from 'morgan'
import { LoggerInstance } from 'winston'
import { Configuration } from './config'

import './controllers/user.controller'

import { DatabaseService } from './services/database.service'
import { Services } from './types'

export async function initializeServer(containerPromise: Promise<Container>) {

  let container = await containerPromise

  let config = container.get<Configuration>(Services.Config)

  let databaseService = container.get<DatabaseService>(Services.Database)
  await databaseService.initialize()

  let logger = container.get<LoggerInstance>(Services.Logger)

  // start the server
  let server = new InversifyExpressServer(container)

  server.setConfig((app) => {
    // convert http post data to json automatically
    app.use(bodyParser.urlencoded({
      extended: true,
    }))
    app.use(bodyParser.json())

    // enable CORS headers
    app.use(cors())

    // set http security headers
    app.use(helmet())

    // configure serving client as static files
    app.use(express.static('public'))

    // configure morgan to use the app's logger for http request logging
    app.use(morgan('combined', {
      stream: {
        write: logger.info,
      },
    }))
  })

  let app = server.build()

  return new Promise<http.Server>((resolve) => {
    // start the server
    let httpServer = app.listen(config.port, () => {
      logger.info(`Starter server listening on port ${config.port}`)
      resolve(httpServer)
    })
  })
}
