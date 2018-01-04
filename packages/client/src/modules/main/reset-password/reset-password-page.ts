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
import { Component } from "@angular/core"
import { FormBuilder, FormGroup, ValidatorFn, Validators } from "@angular/forms"
import {
  AlertController, IonicPage, Loading, LoadingController, NavController,
  NavParams,
} from "ionic-angular"
import { Observable } from "rxjs/Observable"
import { empty } from "rxjs/observable/empty"
import { timer } from "rxjs/observable/timer"
import { mapTo, switchMap, take } from "rxjs/operators"
import { mergeStatic } from "rxjs/operators/merge"
import { Subject } from "rxjs/Subject"
import { ConfigurationService } from "../../../config/configuration.service"

import { LoginPage } from "../login/login-page"

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'reset-password-login',
  templateUrl: 'reset-password-page.html',
})
@IonicPage({
  name: 'reset-password',
  segment: 'reset-password/:username/:token',
})
export class ResetPasswordPage {
  loading: Loading

  feedbackEvents: Subject<Feedback> = new Subject<Feedback>()
  feedback: Observable<Feedback>

  username: string
  token: string

  form: FormGroup

  constructor(private navParams: NavParams,
              private formBuilder: FormBuilder,
              private nav: NavController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private http: HttpClient,
              private config: ConfigurationService) {

    this.form = this.formBuilder.group({
      username: [null, Validators.required],
      password: [null, Validators.required],
      confirmedPassword: [null, Validators.required],
    }, {
      validator: this.passwordsDontMatch,
    })
  }

  ionViewWillLoad() {
    this.username = this.navParams.get('username')
    this.token = this.navParams.get('token')

    if (!this.username || !this.token) {
      this.nav.setRoot(LoginPage)
      return
    }

    this.form.get('username').patchValue(this.username)

    this.form.statusChanges.subscribe(() => {
      if (this.form.invalid && (this.form.dirty || this.form.touched) && this.form.errors) {
        let errors = this.form.errors
        let errorName = Object.getOwnPropertyNames(errors)[0]
        let inError = errors[errorName]

        if (inError) {
          this.showFeedback({
            'passwordsMismatch': `Passwords don't match`,
          }[errorName], true)
        }
      } else {
        this.clearFeedback()
      }
    })

    this.feedback = mergeStatic(
      this.feedbackEvents,
      this.feedbackEvents.pipe(
        switchMap(f => f == null ? empty() : timer(4000)),
        mapTo(null),
      ),
    )
  }

  public async resetPassword() {
    let password = this.form.get('password').value
    let confirmedPassword = this.form.get('confirmedPassword').value

    if (password !== confirmedPassword) {
      this.showFeedback(`Passwords don't match`, true)
    } else {
      this.showLoading()
      let serverUrl = this.config.base.serverUrl

      type ResetResponse = { ok: boolean, error?: string }

      try {
        let response = await this.http.post<ResetResponse>(
          `${serverUrl}/user/confirm-password-reset`,
          { 'username': this.username, 'token': this.token, 'new-password': password },
        ).pipe(take(1)).toPromise()

        if (response.ok) {
          await this.nav.setRoot(LoginPage)
        } else {
          await this.showError(`Reset password failed: ${response.error}`)
        }
      } catch (error) {
        await this.showError(`Reset password failed: ${error.message}`)
      } finally {
        this.loading.dismiss()
      }
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

  private showFeedback(message: string, error: boolean = false) {
    this.feedbackEvents.next(new Feedback(message, error))
  }

  private clearFeedback() {
    this.feedbackEvents.next(null)
  }

  passwordsDontMatch: ValidatorFn = c => {
    let password = c.get('password').value
    let confirmedPassword = c.get('confirmedPassword').value
    return password === null || confirmedPassword === null || password === confirmedPassword ?
      null : { "passwordsMismatch": true }
  }
}
