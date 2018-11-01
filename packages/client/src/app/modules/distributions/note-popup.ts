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

import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { ModalController, NavParams } from '@ionic/angular'

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
          <ion-button icon-only (click)="save()" [disabled]="!canSave()">
            {{ 'DIALOGS.SAVE' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="form">
        <ion-textarea formControlName="content" elastic></ion-textarea>
      </form>
    </ion-content>
  `,
})
export class NotePopup implements OnInit {

  form: FormGroup

  private previousValue

  constructor(private params: NavParams,
              private modalController: ModalController,
              private formBuilder: FormBuilder) {

    this.form = this.formBuilder.group({
      content: this.formBuilder.control(null),
    })
  }

  ngOnInit() {
    if (this.params.data) {
      this.previousValue = this.params.data.note
      this.form.patchValue(this.params.data.note)
    }
  }

  canSave() {
    let value = this.valueOrUndefined(this.form.value)
    return value !== this.previousValue
      && (!value || !this.previousValue || value.content !== this.previousValue.content)
  }

  async save() {
    let data = this.valueOrUndefined(this.form.value)
    await this.modalController.dismiss(data, 'save')
  }

  async dismiss() {
    await this.modalController.dismiss(null, 'cancel')
  }

  valueOrUndefined(value: any) {
    return !value || value.content === null || value.content === '' ? undefined : value
  }
}
