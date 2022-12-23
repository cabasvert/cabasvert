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
import { Logger } from 'winston'
import { Configuration } from './config'

import './controllers/user.controller'
import './controllers/status.controller'

import { DatabaseService } from './services/database.service'
import { Services } from './types'
import * as request from 'request'

export async function initializeServer(containerPromise: Promise<Container>): Promise<http.Server> {

  let container = await containerPromise

  let config = container.get<Configuration>(Services.Config)

  let databaseService = container.get<DatabaseService>(Services.Database)
  await databaseService.initialize()

  let logger = container.get<Logger>(Services.Logger)

  // start the server
  let server = new InversifyExpressServer(container)

  server.setConfig((app) => {
    // TODO proxy $DATABASE_URL/_session and $DATABASE_URL/cabasvert in /db

    app.use((req, res, next) => {
      if (req.path === '/_session') {
        req.pipe(request({ url: config.database.url + '/_session' })).pipe(res)
      } else {
        const match = req.path.match(/^\/db\/(.*)$/)
        if (match) {
          const path = match[1]
          req.pipe(request({ url: config.database.url + '/cabasvert/' + path })).pipe(res)
        } else next()
      }
    })

    // convert http post data to json automatically
    app.use(bodyParser.urlencoded({
      extended: true,
    }))
    app.use(bodyParser.json())

    // enable CORS headers
    app.use(cors())

    // set http security headers
    app.use(helmet())

    // configure morgan to use the app's logger for http request logging
    app.use(morgan('combined', {
      stream: {
        write: (str) => logger.info(str),
      },
    }))

    // configure serving client as static files
    app.use(express.static('public'))
  })

  let application = server.build()

  // application.get('*', (req, res, next) => {
  //   res.redirect(config.clientApplication.url + '/?target=' + req.originalUrl)
  // })

  return new Promise<http.Server>((resolve) => {
    // start the server
    let httpServer = application.listen(config.port, () => {
      logger.info(`Starter server listening on port ${config.port}`)
      resolve(httpServer)
    })
  })
}
