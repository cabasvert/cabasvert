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

import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { IonTextarea, ModalController, NavParams } from '@ionic/angular'

@Component({
  templateUrl: 'note-popup.html',
})
export class NotePopup implements OnInit, AfterViewInit {

  form: FormGroup

  private previousValue

  @ViewChild('noteInput')
  private noteInput: IonTextarea

  constructor(private params: NavParams,
              private modalController: ModalController,
              private formBuilder: FormBuilder) {

    this.form = this.formBuilder.group({
      content: this.formBuilder.control(null),
    })
  }

  ngOnInit() {
    if (this.params.data && this.params.data.note) {
      this.previousValue = this.params.data.note
      this.form.patchValue(this.params.data.note)
    }
  }

  ngAfterViewInit() {
    console.log('Focus !')
    this.noteInput.setFocus()
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
