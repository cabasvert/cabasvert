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

import { Forms } from "../../toolkit/utils/forms"
import { objectAssignNoNulls } from "../../utils/objects"

import { ContractKind } from "../contracts/contract.model"
import { Person, TrialBasket } from "../members/member.model"
import { MemberService } from "../members/member.service"

@Component({
  selector: 'page-edit-trial-basket',
  templateUrl: 'trial-basket-edit-page.html',
})
export class TrialBasketEditPage {
  form: FormGroup

  title: string
  edit: boolean
  person: Person
  trialBasket: TrialBasket

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public formBuilder: FormBuilder,
              private members: MemberService) {

    this.form = this.formBuilder.group({
      person: this.formBuilder.group({
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        address: null,
        phoneNumber: null,
        emailAddress: null,
      }, { asyncValidator: this.personDoesNotAlreadyExist }),
      trialBasket: this.formBuilder.group({
        week: [1, Validators.required],
        sections: this.formBuilder.array(
          [ContractKind.VEGETABLES, ContractKind.EGGS].map(kind => {
            let section = this.formBuilder.group({
              kind: [kind, Validators.required],
              count: [1, Validators.required],
            })
            Forms.forceCastAsNumberOrNull(section.get('count'))
            return section
          })
        ),
      }),
    })
    Forms.forceCastAsNumberOrNull(this.form.get('trialBasket.week'))
  }

  ionViewDidLoad() {
    if (this.navParams.data) {
      this.title = this.navParams.data.title
      this.edit = this.navParams.data.edit
      this.person = this.navParams.data.person
      this.trialBasket = this.navParams.data.trialBasket

      this.form.patchValue({
        person: this.person,
        trialBasket: this.trialBasket
      })

      if (this.edit) {
        this.form.get('person').disable()
      }
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

  get personControl() {
    return this.form.get('person')
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  save() {
    this.viewCtrl.dismiss({
      person: objectAssignNoNulls({}, this.person, this.form.get('person').value),
      trialBasket: objectAssignNoNulls({}, this.trialBasket, this.form.get('trialBasket').value)
    })
  }
}
