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

import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, NavParams } from '@ionic/angular';
import { EMPTY, merge, Observable, Subject, timer } from 'rxjs';
import { mapTo, switchMap, take } from 'rxjs/operators';
import { ConfigurationService } from '../../config/configuration.service';

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'reset-password-login',
  templateUrl: 'reset-password-page.html',
})
export class ResetPasswordPage implements OnInit {

  feedbackEvents: Subject<Feedback> = new Subject<Feedback>();
  feedback: Observable<Feedback>;

  username: string;
  token: string;

  form: FormGroup;

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
    });
  }

  ngOnInit() {
    this.username = this.navParams.get('username');
    this.token = this.navParams.get('token');

    if (!this.username || !this.token) {
      this.nav.navigateRoot('/login');
      return;
    }

    this.form.get('username').patchValue(this.username);

    this.form.statusChanges.subscribe(() => {
      if (this.form.invalid && (this.form.dirty || this.form.touched) && this.form.errors) {
        const errors = this.form.errors;
        const errorName = Object.getOwnPropertyNames(errors)[0];
        const inError = errors[errorName];

        if (inError) {
          this.updateFeedback({
            'passwordsMismatch': `Passwords don't match`,
          }[errorName], true);
        }
      } else {
        this.clearFeedback();
      }
    });

    this.feedback = merge(
      this.feedbackEvents,
      this.feedbackEvents.pipe(
        switchMap(f => f == null ? EMPTY : timer(4000)),
        mapTo(null),
      ),
    );
  }

  public async resetPassword() {
    const password = this.form.get('password').value;
    const confirmedPassword = this.form.get('confirmedPassword').value;

    if (password !== confirmedPassword) {
      this.updateFeedback(`Passwords don't match`, true);
    } else {
      await this.showLoading();

      const serverUrl = this.config.base.serverUrl;

      interface ResetResponse {
        ok: boolean;
        error?: string;
      }

      try {
        const response = await this.http.post<ResetResponse>(
          `${serverUrl}/api/user/confirm-password-reset`,
          { 'username': this.username, 'token': this.token, 'new-password': password },
        ).pipe(take(1)).toPromise();

        if (response.ok) {
          await this.nav.navigateRoot('/login');
        } else {
          await this.showError(`Reset password failed: ${response.error}`);
        }
      } catch (error) {
        await this.showError(`Reset password failed: ${error.message}`);
      } finally {
        await this.dismissLoading();
      }
    }
  }

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Please wait...',
    });
    await loading.present();
  }

  async dismissLoading() {
    await this.loadingCtrl.dismiss();
  }

  async showError(text) {
    await this.dismissLoading();

    const alert = await this.alertCtrl.create({
      header: 'Fail',
      subHeader: text,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private updateFeedback(message: string, error: boolean = false) {
    this.feedbackEvents.next(new Feedback(message, error));
  }

  private clearFeedback() {
    this.feedbackEvents.next(null);
  }

  passwordsDontMatch: ValidatorFn = c => {
    const password = c.get('password').value;
    const confirmedPassword = c.get('confirmedPassword').value;
    return password === null || confirmedPassword === null || password === confirmedPassword ?
      null : { 'passwordsMismatch': true };
  };
}
