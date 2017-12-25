import * as http from 'http'
import 'reflect-metadata'

import { initializeContainer } from './bootstrap'
import { initializeServer } from './server'

export let server: Promise<http.Server> = initializeServer(initializeContainer())
