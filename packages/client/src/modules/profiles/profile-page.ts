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

import { Component } from "@angular/core"
import { AuthService, User } from "../../toolkit/providers/auth-service"
import { Subscription } from "rxjs/Subscription"
import { Navigation } from "../../toolkit/providers/navigation"
import { ChangePasswordPage } from "./change-password-page"

@Component({
  selector: 'page-profile',
  templateUrl: './profile-page.html',
  providers: [Navigation],
})
export class ProfilePage {

  user: User
  private subscription: Subscription

  constructor(private authService: AuthService,
              private navigator: Navigation) {
  }

  ionViewWillLoad() {
    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  public changePassword() {
    this.navigator.push(ChangePasswordPage, {})
      .subscribe(() => {})
  }
}
