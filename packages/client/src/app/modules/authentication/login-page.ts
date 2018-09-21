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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { EMPTY, merge, Observable, Subject, timer } from 'rxjs';
import { mapTo, switchMap, take } from 'rxjs/operators';
import { ConfigurationService } from '../../config/configuration.service';
import { AuthService } from '../../toolkit/providers/auth-service';

export class Feedback {
  constructor(public message: string, public isError: boolean = false) {
  }
}

@Component({
  selector: 'page-login',
  templateUrl: 'login-page.html',
})
export class LoginPage implements OnInit {

  feedbackEvents: Subject<Feedback> = new Subject<Feedback>();
  feedback: Observable<Feedback>;

  hasPasswordStorage = false;

  form: FormGroup;

  constructor(private navCtrl: NavController,
              private route: ActivatedRoute,
              private auth: AuthService,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private formBuilder: FormBuilder,
              private http: HttpClient,
              private config: ConfigurationService) {

    this.form = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      storePassword: false,
    });
  }

  ngOnInit() {
    this.feedback = merge(
      this.feedbackEvents,
      this.feedbackEvents.pipe(
        switchMap(f => f == null ? EMPTY : timer(4000)),
        mapTo(null),
      ),
    );

    const paramMap = this.route.snapshot.paramMap;
    const username = paramMap.get('username');
    const password = paramMap.get('password');
    if (username) {
      this.form.get('username').patchValue(username);
    }
    if (password) {
      this.form.get('password').patchValue(password);
    }

    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has);

    this.auth.tryLoadCredentials().then(credentials => {
      if (credentials) {
        this.form.patchValue(credentials);
        this.form.get('storePassword').patchValue(true);
      }
    });
  }

  public async login() {
    await this.showLoading();

    try {
      const granted = await this.auth.login(this.form.getRawValue());

      await this.dismissLoading();

      if (granted) {
        if (this.form.get('storePassword').value) {
          await this.auth.tryStoreCredentials();
        }

        await this.navCtrl.navigateRoot(['/']);
      } else {
        this.updateFeedback('Access Denied.', true);
      }
    } catch (error) {
      await this.showError(`Login failed: ${error.message}`);
    } finally {
      // await this.dismissLoading();
    }
  }

  public async forgotPassword() {
    const mailInput = await this.alertCtrl.create({
      header: 'Password Recovery',
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
          handler: data => this.handleRequestPasswordReset(data),
        },
      ],
    });
    await mailInput.present();
  }

  private async handleRequestPasswordReset(data) {
    (async () => {
      await this.requestPasswordReset(data.email);

      await this.alertCtrl.dismiss();

      this.updateFeedback('An email will be sent to you shortly.');
    })();
    return false;
  }

  private async requestPasswordReset(email: string) {
    await this.showLoading();

    const serverUrl = this.config.base.serverUrl;

    interface ResetResponse {
      ok: boolean;
      error?: string;
    }

    try {
      const response = await this.http.get<ResetResponse>(
        `${serverUrl}/api/user/request-password-reset/${email}`,
      ).pipe(take(1)).toPromise();

      if (response.ok) {
        await this.navCtrl.navigateRoot(['/login']);
      } else {
        await this.showError(`Reset password failed: ${response.error}`);
      }
    } catch (error) {
      await this.showError(`Reset password failed: ${error.message}`);
    } finally {
      await this.dismissLoading();
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
}
