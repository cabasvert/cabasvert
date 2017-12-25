import { readFileSync } from 'graceful-fs'

export type Configuration = {
  port: number

  clientApplication: {
    url: string
  }

  database: {
    url: string
    auth: {
      username: string
      password: string
    }
  }

  smtpConnection: {
    host: string
    port: number
    secure: boolean
    auth: {
      username: string
      password: string
    }
  }
}

export const configuration = parseJsonFile<Configuration>('config.json')

export function parseJsonFile<T>(path: string): T {
  let data = readFileSync(path, 'utf8')
  return JSON.parse(data)
}
