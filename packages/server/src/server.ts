import * as bodyParser from 'body-parser'
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
