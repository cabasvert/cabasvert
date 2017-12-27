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

import { Inject, InjectionToken } from "@angular/core"

export enum LogLevel {
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export let LogConfig = new InjectionToken("log-configuration")

type LogConfiguration = {
  [name: string]: LogLevel
}

export class LogService {

  constructor(@Inject(LogConfig) private config: LogConfiguration) {
  }

  logger(name: string) {
    return new Logger(name, this.config)
  }
}

export class Logger {

  private level: LogLevel

  constructor(private name: string,
              private config: LogConfiguration,
              private prefix: string = null) {
    this.level = config[name]
  }

  public subLogger(name: string) {
    return new Logger(this.name + '|' + name, this.config, this.prefix)
  }

  public withPrefix(prefix: string) {
    return new Logger(this.name, this.config, (this.prefix ? this.prefix + ' ' : '') + prefix)
  }

  private logMessage(level: LogLevel, label: string,
                     out: (string, ...params) => void): (message: string) => void {
    return (message: string) => {
      if (this.level >= level)
        out(`${label} [${this.name}] ${this.prefix ? this.prefix + ' ' : ''}${message}`)
    }
  }

  // Use console.log for debug level as console.debug is not supported by ionic console
  public debug = this.logMessage(LogLevel.DEBUG, "DEBUG", console.log)
  public info = this.logMessage(LogLevel.INFO, "INFO ", console.info)
  public warn = this.logMessage(LogLevel.WARN, "WARN ", console.warn)
  public error = this.logMessage(LogLevel.ERROR, "ERROR", console.error)
}
