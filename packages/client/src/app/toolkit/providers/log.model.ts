export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export type LogConfiguration = {
  [name: string]: LogLevel
}
