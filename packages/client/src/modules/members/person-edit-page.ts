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
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from "@angular/forms"

import { NavParams, ViewController } from "ionic-angular"
import { of } from "rxjs/observable/of"
import { map, take } from "rxjs/operators"
import { Person } from "./member.model"
import { objectAssignNoNulls } from "../../utils/objects"
import { MemberService } from "./member.service"

@Component({
  selector: 'page-edit-person',
  templateUrl: 'person-edit-page.html',
})
export class PersonEditPage {
  form: FormGroup

  title: string
  person: Person

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public formBuilder: FormBuilder,
              private members: MemberService) {
    this.form = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      address: null,
      phoneNumber: null,
      emailAddress: null,
    }, { asyncValidator: this.personDoesNotAlreadyExist })
  }

  ionViewDidLoad() {
    if (this.navParams.data) {
      this.title = this.navParams.data.title
      this.person = this.navParams.data.person
      this.form.patchValue(this.person)
    }
  }

  personDoesNotAlreadyExist: AsyncValidatorFn = c => {
    let lastname = c.get("lastname")
    let firstname = c.get("firstname")

    if (!lastname.value || !firstname.value) return of(null)

    return this.members.getMember$(lastname.value, firstname.value).pipe(
      map(m => !m ? null : { "memberAlreadyExists": true }),
      take(1),
    )
  }

  problems() {
    let control = this.form
    return (control.invalid && (control.dirty || control.touched) && control.errors) ?
      control.errors : null
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  save() {
    this.viewCtrl.dismiss(objectAssignNoNulls({}, this.person, this.form.value))
  }
}
