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

import { Injectable } from '@angular/core'
import { Plugins } from '@capacitor/core'
import { TranslateService } from '@ngx-translate/core'
import { BehaviorSubject } from 'rxjs'
import { environment } from '../../../environments/environment'
import { LogService } from './log-service'
import { Logger } from './logger'

const { Storage } = Plugins

@Injectable()
export class LocaleManagerService {

  private _logger: Logger

  private get log() {
    return this._logger ? this._logger : this._logger = this.logService.logger('Locale')
  }

  public readonly locale$ = new BehaviorSubject<string>(null)

  constructor(private logService: LogService,
              private translate: TranslateService) {
  }

  public async initialize() {
    const storedLocale = await Storage.get({ key: 'locale' })
    const locale = !(storedLocale && storedLocale.value) ? this.defaultLocale() : storedLocale.value

    this.locale$.next(locale)
    this.doChangeLocale()
  }

  private defaultLocale() {
    return environment.localeOverride ? environment.localeOverride : 'auto'
  }

  private async storeLocale(locale: string) {
    await Storage.set({ key: 'locale', value: locale })
  }

  set locale(locale: string) {
    this.locale$.next(locale)
    this.doChangeLocale()
    this.storeLocale(locale)
  }

  get effectiveLocale(): string {
    const selectedLocale = this.locale$.getValue()
    return selectedLocale === 'auto' ? navigator.language : selectedLocale
  }

  private doChangeLocale() {
    const locale = this.effectiveLocale
    this.log.info(`Selected locale: ${locale}`)

    const userLang = locale.split('-')[0]
    this.translate.setDefaultLang('fr')
    this.translate.use(userLang).subscribe(() => {
      this.log.info(`Selected language: ${this.translate.instant('language')}`)
    })
  }
}
