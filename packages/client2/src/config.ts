import dotenv from 'dotenv'
import { LogConfiguration, LogLevel } from './utils/logger'

dotenv.config()

export const environment = { production: process.env.NODE_ENV === 'production' }

export const databaseUrl = process.env.DATABASE_URL || 'http://localhost:3000'
export const serverUrl = process.env.SERVER_URL || 'http://localhost:4000'

export const remoteDBOnly = process.env.REMOTE_DB_ONLY === '1'
export const debugPouchDB = false

export const defaultLogLevel = environment.production ? LogLevel.INFO : LogLevel.DEBUG
export const logConfiguration: LogConfiguration = {
  'App': defaultLogLevel,
  'Locale': defaultLogLevel,
  'Database': defaultLogLevel,
  'Database|Remote': defaultLogLevel,
  'Database|Local': defaultLogLevel,
  'Auth': defaultLogLevel,
}

console.groupCollapsed('Configuration')
console.log('environment:', environment)
console.log('databaseUrl:', databaseUrl)
console.log('serverUrl:', serverUrl)
console.log('remoteDBOnly:', remoteDBOnly)
console.log('debugPouchDB:', debugPouchDB)
console.log('defaultLogLevel:', defaultLogLevel)
console.log('logConfiguration:', logConfiguration)
console.groupEnd()
