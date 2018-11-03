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

import { Component, OnDestroy, OnInit } from '@angular/core'
import { Observable, Subscription } from 'rxjs'
import { map } from 'rxjs/operators'
import { AuthService, User } from '../../toolkit/providers/auth-service'
import { Dialogs } from '../../toolkit/dialogs/dialogs.service'
import { ThemeManagerService } from '../../toolkit/providers/theme-manager.service'
import { ContractsEditForm } from '../contracts/contracts-edit-page'
import { ChangePasswordPage } from './change-password-page'

@Component({
  selector: 'page-profile',
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit, OnDestroy {

  user: User
  private subscription: Subscription

  isDarkTheme$: Observable<boolean>

  constructor(private authService: AuthService,
              private dialogs: Dialogs,
              private themeManager: ThemeManagerService) {
  }

  ngOnInit() {
    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)

    this.isDarkTheme$ = this.themeManager.theme$.pipe(
      map(theme => theme === 'dark'),
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  public changePassword() {
    this.dialogs.showModal$({ component: ChangePasswordPage, componentProps: {} }).subscribe()
  }

  toggleDarkTheme($event) {
    this.themeManager.theme = $event.detail.checked ? 'dark' : 'light'
  }
}
