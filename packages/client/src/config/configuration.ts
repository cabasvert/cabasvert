import { LogLevel } from "../toolkit/providers/log-service"

declare const process: any

type Environment = { node: string, ionic: string }

export function environment(): Environment {
  let node = process.env.NODE_ENV || 'dev'
  let ionic = process.env.IONIC_ENV || 'dev'
  return { node, ionic }
}

export function configuration() {
  let env = environment()
  if (env.ionic === 'prod') {
    if (!process.env.DATABASE_URL) {
      console.error('This is a production build but DATABASE_URL is not set!')
    }
    if (!process.env.SERVER_URL) {
      console.error('This is a production build but SERVER_URL is not set!')
    }
  }

  return {
    databaseUrl: process.env.DATABASE_URL || 'http://localhost:5984',
    serverUrl: process.env.SERVER_URL || 'http://localhost:8080',

    remoteDBOnly: false,
    wipeLocalDB: false,
    debugPouch: false,
  }
}

export function logConfiguration() {
  let env = environment()
  let ionicProd = env.ionic == 'prod'

  return {
    'Database': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Database|Remote': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Database|Local': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
    'Auth': ionicProd ? LogLevel.WARN : LogLevel.DEBUG,
  }
}
