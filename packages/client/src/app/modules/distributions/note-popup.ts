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
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  template: `
    <ion-header>
      <ion-toolbar hideBackButton>
        <ion-buttons slot="start">
          <ion-button icon-only (click)="dismiss()">
            <ion-icon name="arrow-back"></ion-icon>
            {{ 'DIALOGS.CANCEL' | translate }}
          </ion-button>
        </ion-buttons>

        <ion-title>
          {{ 'NOTES.EDIT_NOTES' | translate }}
        </ion-title>

        <ion-buttons slot="primary">
          <ion-button icon-only (click)="submit.click()" [disabled]="!form.valid">
            {{ 'DIALOGS.SAVE' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="form" novalidate (ngSubmit)="save()">
        <input #submit type="submit" value="Submit" style="display:none"/>

        <ion-textarea formControlName="content" elastic></ion-textarea>
      </form>
    </ion-content>
  `,
})
export class NotePopup implements OnInit {

  form: FormGroup;

  constructor(private params: NavParams,
              private modalController: ModalController,
              private formBuilder: FormBuilder) {

    this.form = this.formBuilder.group({
      content: this.formBuilder.control(['']),
    });
  }

  ngOnInit() {
    if (this.params.data) {
      this.form.patchValue(this.params.data);
    }
  }

  async save() {
    await this.modalController.dismiss(this.form.value);
  }

  async dismiss() {
    await this.modalController.dismiss();
  }
}
