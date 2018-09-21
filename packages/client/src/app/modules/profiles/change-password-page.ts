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

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Observable, of, Subject } from 'rxjs';
import { AuthService } from '../../toolkit/providers/auth-service';
import { Feedback } from '../authentication/login-page';

@Component({
  selector: 'page-change-password',
  templateUrl: './change-password-page.html',
})
export class ChangePasswordPage implements OnInit {

  feedbackEvents: Subject<Feedback> = new Subject<Feedback>();
  feedback: Observable<Feedback>;

  hasPasswordStorage = false;

  form: FormGroup;

  constructor(private auth: AuthService,
              private modalCtrl: ModalController,
              private alertCtrl: AlertController,
              private loadingCtrl: LoadingController,
              private formBuilder: FormBuilder) {

    this.form = this.formBuilder.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmedPassword: ['', Validators.required],
      storePassword: false,
    }, { validator: this.passwordsDoNotMatch });
  }

  ngOnInit() {
    this.auth.hasPasswordStorage.then(has => this.hasPasswordStorage = has);
  }

  async doChangePassword() {
    await this.showLoading();

    try {
      const success = await this.auth.changePassword({
        oldPassword: this.form.get('oldPassword').value,
        newPassword: this.form.get('newPassword').value,
        confirmedPassword: this.form.get('confirmedPassword').value,
      });

      if (success) {
        if (this.form.get('storePassword').value) {
          await this.auth.tryStoreCredentials();
        }

        await this.dismissLoading();

        await this.modalCtrl.dismiss();
      } else {
        await this.showError('Access Denied.');
      }
    } catch (error) {
      await this.showError(error);
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

  async dismiss() {
    await this.modalCtrl.dismiss();
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

  get isValid() {
    return this.form.valid;
  }

  get problems() {
    return this.problemsForControl(this.form);
  }

  problemsFor(path: string) {
    const control = this.form.get(path);
    return this.problemsForControl(control);
  }

  private problemsForControl(control) {
    return (control.invalid && control.errors) ?
      control.errors : null;
  }

  passwordsDoNotMatch: ValidatorFn = c => {
    const newPassword = c.get('newPassword');
    const confirmedPassword = c.get('confirmedPassword');

    if (!newPassword.value || !confirmedPassword.value) {
      return of(null);
    }

    return newPassword.value === confirmedPassword.value ? null : { 'passwordsDoNotMatch': true };
  }
}
