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

  private readonly level: LogLevel;

  public readonly debug: (...params) => void;
  public readonly info: (...params) => void;
  public readonly warn: (...params) => void;
  public readonly error: (...params) => void;
  public readonly group: (...params) => void;
  public readonly groupCollapsed: (...params) => void;

  constructor(private name: string,
              private config: LogConfiguration,
              private prefix: string = null) {
    this.level = config[name];

    this.debug = this.setupLogFunction(LogLevel.DEBUG, BLUE, 'debug');
    this.info = this.setupLogFunction(LogLevel.INFO, GREEN, 'info');
    this.warn = this.setupLogFunction(LogLevel.WARN, YELLOW, 'warn');
    this.error = this.setupLogFunction(LogLevel.ERROR, RED, 'error');
    this.group = this.setupLogFunction(LogLevel.ERROR, GREY, 'group');
    this.groupCollapsed = this.setupLogFunction(LogLevel.ERROR, GREY, 'groupCollapsed');
  }

  private setupLogFunction(minLevel: LogLevel, color: string, key: string): (...params) => void {
    if (this.level >= minLevel) {
      const logPrefix = `${this.name}${this.prefix ? ' ' + this.prefix : ''}`;

      if (environment.production) {
        return console[key].bind(window.console, logPrefix);
      }

      const formattedLogPrefix = [
        `%c${logPrefix}`,
        `background: ${color}; color: white; padding: 2px 0.5em; border-radius: 0.5em;`,
      ];

      return console[key].bind(window.console, ...formattedLogPrefix);
    } else {
      return (...params) => null;
    }
  }

  public groupEnd() {
    console.groupEnd();
  }

  public subLogger(name: string) {
    return new Logger(this.name + '|' + name, this.config, this.prefix);
  }

  public withPrefix(prefix: string) {
    return new Logger(this.name, this.config, (this.prefix ? this.prefix + ' ' : '') + prefix);
  }
}
