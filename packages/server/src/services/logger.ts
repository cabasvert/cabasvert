import * as fs from 'fs'
import * as winston from 'winston'

const logDir = './logs/'
const logFile = 'server.log.json'

// create log dir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

export let logger: winston.LoggerInstance = new winston.Logger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: logDir + logFile,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
    }),
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
    }),
  ],
  exitOnError: false,
})
