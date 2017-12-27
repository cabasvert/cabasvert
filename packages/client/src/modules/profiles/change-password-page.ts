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
import { AlertController, Loading, LoadingController, NavController } from "ionic-angular"
import { AuthService } from "../../toolkit/providers/auth-service"

@Component({
  selector: 'page-change-password',
  templateUrl: './change-password-page.html',
})
export class ChangePasswordPage {
  loading: Loading

  passwords = { oldPassword: null, newPassword: null, confirmedPassword: null, }
  hasPasswordStorage = false
  storePassword = false

  constructor(private auth: AuthService,
              private nav: NavController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController) {
  }

  ionViewWillLoad() {
    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has)

  }

  doChangePassword() {
    this.showLoading()
    return this.auth.changePassword(this.passwords)
      .then(success => {
        if (success) {
          if (this.storePassword) this.auth.maybeStoreCredentials()

          this.loading.dismiss()

          return this.nav.pop()
        } else {
          return this.showError('Access Denied.')
        }
      })
      .catch(error => this.showError(error))
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...'
    })
    this.loading.present()
  }

  showError(text) {
    this.loading.dismiss()

    let alert = this.alertCtrl.create({
      title: 'Fail',
      subTitle: text,
      buttons: ['OK'],
    })
    return alert.present()
  }
}
