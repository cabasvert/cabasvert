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
import { Observable } from "rxjs/Observable"
import { of } from "rxjs/observable/of"
import { map, take } from "rxjs/operators"

import { Forms } from "../../toolkit/utils/forms"
import { objectAssignNoNulls } from "../../utils/objects"

import { ContractKind } from "../contracts/contract.model"
import { Member, Person, TrialBasket } from "../members/member.model"
import { MemberService } from "../members/member.service"
import { Season, SeasonWeek } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

@Component({
  selector: 'page-edit-trial-basket',
  templateUrl: 'trial-basket-edit-page.html',
})
export class TrialBasketEditPage {
  form: FormGroup

  title: string
  edit: boolean
  member: Member
  trialBasket: TrialBasket

  season$: Observable<Season>
  weeks$: Observable<SeasonWeek[]>

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public formBuilder: FormBuilder,
              private members: MemberService,
              private seasons: SeasonService) {

    this.form = this.formBuilder.group({
      trialBasket: this.formBuilder.group({
        week: [1, Validators.required],
        paid: false,
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
      this.member = this.navParams.data.member
      this.trialBasket = this.navParams.data.trialBasket

      this.form.patchValue({
        trialBasket: this.trialBasket
      })
    }

    this.season$ = this.seasons.seasonById$(this.trialBasket.season)
    this.weeks$ = this.season$.pipe(map(s => s.seasonWeeks()))
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  save() {
    this.viewCtrl.dismiss({
      trialBasket: objectAssignNoNulls({}, this.trialBasket, this.form.get('trialBasket').value)
    })
  }
}
