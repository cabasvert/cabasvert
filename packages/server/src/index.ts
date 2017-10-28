import * as http from 'http'
import 'reflect-metadata'

import { container } from './bootstrap'
import './bootstrap'
import { initializeServer } from './server'

export let server: Promise<http.Server> = initializeServer(container)
