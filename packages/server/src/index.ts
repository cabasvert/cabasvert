import * as http from 'http'
import 'reflect-metadata'

import { initializeContainer } from './bootstrap'
import { Configuration } from './config'
import { initializeServer } from './server'

export function startServer(configuration: Configuration): Promise<http.Server> {
  return initializeServer(initializeContainer(configuration))
}
