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

import { HttpClient } from '@angular/common/http'
import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { of } from 'rxjs'
import { catchError, take } from 'rxjs/operators'
import { ConfigurationService } from '../../config/configuration.service'

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'reset-password-login',
  templateUrl: 'reset-password-page.html',
})
export class ResetPasswordPage implements OnInit {

  username: string
  token: string

  form: FormGroup

  constructor(private nav: NavController,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private toastCtrl: ToastController,
              private http: HttpClient,
              private config: ConfigurationService,
              private translate: TranslateService) {

    this.form = this.formBuilder.group({
      username: [null, Validators.required],
      password: [null, Validators.required],
      confirmedPassword: [null, Validators.required],
    }, {
      validator: this.passwordsDoNotMatch,
    })
  }

  ngOnInit() {
    let params = this.route.snapshot.paramMap
    this.username = params.get('username')
    this.token = params.get('token')

    if (!this.username || !this.token) {
      this.nav.navigateRoot('/login')
      return
    }

    this.form.get('username').patchValue(this.username)
  }

  public async resetPassword() {
    const password = this.form.get('password').value
    const confirmedPassword = this.form.get('confirmedPassword').value

    if (password === confirmedPassword) {
      await this.showLoading(this.translate.instant('RESET_PASSWORD.CHANGING_PASSWORD'))

      const serverUrl = this.config.base.serverUrl

      interface ResetResponse {
        ok: boolean
        error?: string
      }

      try {
        const response = await this.http.post<ResetResponse>(
          `${serverUrl}/api/user/confirm-password-reset`,
          { 'username': this.username, 'token': this.token, 'new-password': password },
        ).pipe(
          take(1),
          catchError(err => of(err)),
        ).toPromise()

        if (response.ok) {
          await this.dismissLoading()
          await this.showFeedback(this.translate.instant('RESET_PASSWORD.PASSWORD_CHANGED'))
          await this.nav.navigateRoot('/login')
        } else {
          await this.dismissLoading()
          await this.showError(
            this.translate.instant('RESET_PASSWORD.RESET_PASSWORD_FAILED'),
            this.translate.instant('RESET_PASSWORD.ERROR_' + response.error.code),
          )
        }
      } catch (error) {
        await this.dismissLoading()
        await this.showError(
          this.translate.instant('RESET_PASSWORD.RESET_PASSWORD_FAILED'),
          error.message
        )
      } finally {
      }
    }
  }

  private async showLoading(message: string) {
    const loading = await this.loadingCtrl.create({ message })
    await loading.present()
  }

  private async dismissLoading() {
    await this.loadingCtrl.dismiss()
  }

  private async showError(header, message) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    })
    await alert.present()
  }

  private feedbackVisible = false

  private async showFeedback(message: string, error: boolean = false) {
    let oldFeedback = this.feedbackVisible ? await this.toastCtrl.getTop() : null

    const toast = await this.toastCtrl.create({
      message,
      cssClass: error ? 'error-toast' : 'success-toast',
      duration: 5000,
    })
    await toast.present()
    if (oldFeedback) {
      await oldFeedback.dismiss()
    }
    this.feedbackVisible = true

    await toast.onDidDismiss()
    this.feedbackVisible = false
  }

  get problems() {
    let control = this.form
    return control.invalid && control.errors ? control.errors : null
  }

  passwordsDoNotMatch: ValidatorFn = c => {
    const password = c.get('password').value
    const confirmedPassword = c.get('confirmedPassword').value
    return password === null || confirmedPassword === null || password === confirmedPassword ?
      null : { 'passwordsMismatch': true }
  }
}
