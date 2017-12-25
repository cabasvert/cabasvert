import * as http from 'http'
import * as parseCli from 'minimist'
import { Configuration, parseJsonFile } from './config'
import { startServer } from './index'

let argv = parseCli(process.argv.slice(2))
let configPath = argv['config'] || 'config.json'
let configuration = parseJsonFile<Configuration>(configPath)

let server: Promise<http.Server> = startServer(configuration)
