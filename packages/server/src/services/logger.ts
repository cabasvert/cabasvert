/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as fs from 'fs'
import { format } from 'winston'
import * as winston from 'winston'
import { Configuration } from '../config'

const logDir = './logs/'
const logFile = 'server.log.json'

// create log dir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

export let logger = (configuration: Configuration) => winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: logDir + logFile,
      handleExceptions: true,
      format: format.json(),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      level: 'debug',
      silent: configuration.log && configuration.log.silent,
      handleExceptions: true,
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      ),
    }),
  ],
  exitOnError: false,
})
