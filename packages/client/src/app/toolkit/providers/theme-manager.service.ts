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
import { BehaviorSubject } from 'rxjs'

const { Storage } = Plugins

export type Theme = 'light' | 'dark'

@Injectable()
export class ThemeManagerService {

  theme$ = new BehaviorSubject<Theme>(null)

  constructor() {
    this.initializeTheme()
  }

  private async initializeTheme() {
    let storedTheme = await Storage.get({ key: 'theme' })
    let theme = !(storedTheme && storedTheme.value) ? 'light' : storedTheme.value as Theme
    this.theme$.next(theme)
  }

  private async storeTheme(theme: Theme) {
    await Storage.set({ key: 'theme', value: theme })
  }

  set theme(theme: Theme) {
    this.theme$.next(theme)
    this.storeTheme(theme)
  }
}
