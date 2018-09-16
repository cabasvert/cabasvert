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

import { environment } from '../../../environments/environment';
import { LogConfiguration, LogLevel } from './log.model';

const BLUE = `#3498db`;
const GREEN = `#2ecc71`;
const GREY = `#7f8c8d`;
const YELLOW = `#f39c12`;
const RED = `#c0392b`;

export class Logger {

  private level: LogLevel;

  constructor(private name: string,
              private config: LogConfiguration,
              private prefix: string = null) {
    this.level = config[name];
  }

  public subLogger(name: string) {
    return new Logger(this.name + '|' + name, this.config, this.prefix);
  }

  public withPrefix(prefix: string) {
    return new Logger(this.name, this.config, (this.prefix ? this.prefix + ' ' : '') + prefix);
  }

  private logMessage(minLevel: LogLevel, color: string, key: string): (...params) => void {
    return (...params) => {
      if (this.level >= minLevel) {
        const logPrefix = `${this.name}${this.prefix ? ' ' + this.prefix : ''}`;

        if (environment.production) {
          console[key](`${logPrefix}: `, ...params);
          return;
        }

        const formattedLogPrefix = [
          `%c${logPrefix}`,
          `background: ${color}; color: white; padding: 2px 0.5em; border-radius: 0.5em;`,
        ];

        console[key](...formattedLogPrefix, ...params);
      }
    };
  }

  // Use console.log for debug level as console.debug is not supported by ionic console
  public debug = this.logMessage(LogLevel.DEBUG, BLUE, 'debug');
  public info = this.logMessage(LogLevel.INFO, GREEN, 'info');
  public warn = this.logMessage(LogLevel.WARN, YELLOW, 'warn');
  public error = this.logMessage(LogLevel.ERROR, RED, 'error');
  public group = this.logMessage(LogLevel.ERROR, GREY, 'group');
  public groupCollapsed = this.logMessage(LogLevel.ERROR, GREY, 'groupCollapsed');

  public groupEnd() {
    console.groupEnd();
  }
}
