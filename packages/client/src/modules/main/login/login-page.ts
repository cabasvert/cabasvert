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

import { HttpClient } from "@angular/common/http"
import { Component, Inject } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import {
  AlertController, IonicPage, Loading, LoadingController, NavController,
  NavParams,
} from "ionic-angular"
import { Observable } from "rxjs/Observable"
import { timer } from "rxjs/observable/timer"
import { map, merge, switchMap, take } from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { ConfigurationService } from "../../../config/configuration.service"
import { AuthService } from "../../../toolkit/providers/auth-service"

import { MainPage } from "../main-page"

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'page-login',
  templateUrl: 'login-page.html',
})
@IonicPage({
  name: 'login',
  segment: 'login',
})
export class LoginPage {
  loading: Loading

  feedbackEvents: Subject<Feedback> = new Subject<Feedback>()
  feedback: Observable<Feedback>

  hasPasswordStorage = false

  form: FormGroup

  constructor(private auth: AuthService,
              private nav: NavController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private formBuilder: FormBuilder,
              private navParams: NavParams,
              private http: HttpClient,
              private config: ConfigurationService) {

    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      storePassword: false,
    })
  }

  ionViewWillLoad() {
    this.feedback = this.feedbackEvents.pipe(merge(
      this.feedbackEvents.pipe(
        switchMap(f => timer(4000)),
        map(n => null),
      ),
    ))

    let username = this.navParams.get('username')
    let password = this.navParams.get('password')
    if (username) this.form.get('username').patchValue(username)
    if (password) this.form.get('password').patchValue(password)

    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has)

    this.auth.maybeLoadCredentials().then(credentials => {
      if (credentials) {
        this.form.patchValue(credentials)
        this.form.get('storePassword').patchValue(true)
      }
    })
  }

  public login(): Promise<any> {
    this.showLoading()
    return this.auth.login(this.form.getRawValue())
      .then(granted => {
        if (granted) {
          if (this.form.get('storePassword').value) this.auth.maybeStoreCredentials()

          this.loading.dismiss()

          // Do not push to avoid the back button to go back to login page
          return this.nav.setRoot(MainPage)
        } else {
          return this.showFeedback('Access Denied.', true)
        }
      })
      .catch(error => this.showError(error))
  }

  public forgotPassword() {
    let mailInput = this.alertCtrl.create({
      title: 'Password Recovery',
      message: 'Request a password reset.',
      inputs: [
        {
          id: 'email',
          type: 'email',
          name: 'email',
          placeholder: 'Enter your email address',
        },
      ],
      buttons: [
        {
          text: 'Cancel', role: 'cancel',
        },
        {
          text: 'Send',
          handler: data => {
            console.log(JSON.stringify(data))
            this.requestPasswordReset(data.email).then(() => {
              return mailInput.dismiss()
            }).then(() => {
              return this.showFeedback('An email will be sent to you shortly.')
            })
            return false
          },
        },
      ],
    })
    mailInput.present()
  }

  private async requestPasswordReset(email: string) {
    this.showLoading()
    let serverUrl = this.config.base.serverUrl

    type ResetResponse = { ok: boolean, error?: string }

    try {
      let response = await this.http.get<ResetResponse>(
        `${serverUrl}/api/user/request-password-reset/${email}`,
      ).pipe(take(1)).toPromise()

      if (response.ok) {
        await this.nav.setRoot(LoginPage)
      } else {
        await this.showError(`Reset password failed: ${response.error}`)
      }
    } catch (error) {
      console.error(JSON.stringify(error))
      await this.showError(`Reset password failed: ${error.message}`)
    } finally {
      this.loading.dismiss()
    }
  }

  showLoading() {
    this.loading = this.loadingCtrl.create({
      content: 'Please wait...',
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

  private showFeedback(message: string, error: boolean = false): Promise<void> {
    return this.loading.dismiss().then(() => {
      this.feedbackEvents.next(new Feedback(message, error))
    })
  }
}
