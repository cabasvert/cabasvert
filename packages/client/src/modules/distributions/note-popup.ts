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
import { FormBuilder, FormGroup } from "@angular/forms"
import { NavParams, ViewController } from "ionic-angular"

@Component({
  template: `
    <ion-header>
      <ion-navbar hideBackButton>
        <ion-buttons left>
          <button ion-button icon-only (click)="dismiss()">
            <ion-icon name="arrow-back"></ion-icon>
            {{ 'DIALOGS.CANCEL' | translate }}
          </button>
        </ion-buttons>

        <ion-title>
          {{ 'NOTES.EDIT_NOTES' | translate }}
        </ion-title>

        <ion-buttons end>
          <button ion-button icon-only (click)="submit.click()" [disabled]="!form.valid">
            {{ 'DIALOGS.SAVE' | translate }}
          </button>
        </ion-buttons>
      </ion-navbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="form" novalidate (ngSubmit)="save()">
        <input #submit type="submit" value="Submit" style="display:none"/>

        <ion-textarea formControlName="content" elastic></ion-textarea>
      </form>
    </ion-content>
  `
})
export class NotePopup {

  form: FormGroup

  constructor(private params: NavParams,
              private viewCtrl: ViewController,
              private formBuilder: FormBuilder) {

    this.form = this.formBuilder.group({
      content: this.formBuilder.control([''])
    })
  }

  ionViewDidLoad() {
    if (this.params.data) {
      this.form.patchValue(this.params.data)
    }
  }

  save() {
    this.viewCtrl.dismiss(this.form.value)
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }
}
