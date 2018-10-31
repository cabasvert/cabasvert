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
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { of } from 'rxjs'
import { catchError, take } from 'rxjs/operators'
import { ConfigurationService } from '../../config/configuration.service'
import { AuthService } from '../../toolkit/providers/auth-service'

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'page-login',
  templateUrl: 'login-page.html',
})
export class LoginPage implements OnInit {

  hasPasswordStorage = false

  form: FormGroup

  constructor(private navCtrl: NavController,
              private route: ActivatedRoute,
              private auth: AuthService,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private toastCtrl: ToastController,
              private formBuilder: FormBuilder,
              private http: HttpClient,
              private config: ConfigurationService,
              private translate: TranslateService) {

    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      storePassword: false,
    })
  }

  ngOnInit() {
    const paramMap = this.route.snapshot.paramMap
    const username = paramMap.get('username')
    const password = paramMap.get('password')
    if (username) {
      this.form.get('username').patchValue(username)
    }
    if (password) {
      this.form.get('password').patchValue(password)
    }

    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has)

    this.auth.tryLoadCredentials().then(credentials => {
      if (credentials) {
        this.form.patchValue(credentials)
        this.form.get('storePassword').patchValue(true)
      }
    })
  }

  public async login() {
    await this.showLoading(this.translate.instant('LOGIN.LOGGING_IN'))

    try {
      const granted = await this.auth.login(this.form.getRawValue())

      if (granted) {
        if (this.form.get('storePassword').value) {
          await this.auth.tryStoreCredentials()
        }

        await this.dismissLoading()
        await this.navCtrl.navigateRoot(['/'])
      } else {
        await this.dismissLoading()
        await this.showFeedback(this.translate.instant('LOGIN.ACCESS_DENIED'), true)
      }
    } catch (error) {
      await this.dismissLoading()
      await this.showError(this.translate.instant('LOGIN.ACCESS_DENIED'), error.message)
    }
  }

  public async forgotPassword() {
    const mailInput = await this.alertCtrl.create({
      header: this.translate.instant('LOGIN.PASSWORD_RECOVERY'),
      message: this.translate.instant('LOGIN.REQUEST_PASSWORD_RESET'),
      inputs: [
        {
          id: 'email',
          type: 'email',
          name: 'email',
          placeholder: this.translate.instant('LOGIN.ENTER_EMAIL_ADDRESS'),
        },
      ],
      buttons: [
        {
          text: this.translate.instant('DIALOGS.CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('DIALOGS.SEND'),
          handler: data => {
            this.handleRequestPasswordReset(data)
            return false
          },
          cssClass: 'send-button',
        },
      ],
    })
    await mailInput.present()
  }

  private async handleRequestPasswordReset(data) {
    await this.showLoading(this.translate.instant('LOGIN.SENDING_PASSWORD_RESET'))

    const serverUrl = this.config.base.serverUrl

    interface ResetResponse {
      ok: boolean
      error?: string
    }

    try {
      const response = await this.http.get<ResetResponse>(
        `${serverUrl}/api/user/request-password-reset/${data.email}`,
      ).pipe(
        take(1),
        catchError(err => of(err)),
      ).toPromise()

      if (response.ok) {
        await this.dismissLoading()
        await this.alertCtrl.dismiss()
        await this.showFeedback(this.translate.instant('LOGIN.EMAIL_SENT'))
      } else {
        await this.dismissLoading()
        await this.showError(
          this.translate.instant('LOGIN.REQUEST_PASSWORD_FAILED'),
          this.translate.instant('LOGIN.ERROR_' + response.error.code),
        )
      }
    } catch (error) {
      await this.dismissLoading()
      await this.showError(
        this.translate.instant('LOGIN.REQUEST_PASSWORD_FAILED'),
        error.message
      )
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
}
