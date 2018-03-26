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
import { FormBuilder, FormGroup, Validators } from "@angular/forms"

import { NavParams, ViewController } from "ionic-angular"
import { Observable } from "rxjs/Observable"
import { map } from "rxjs/operators"
import { objectAssignNoNulls } from "../../utils/objects"
import { Season } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"
import { ContractKind } from "./contract.model"
import { Contract } from "./contract.model"
import { Forms } from "../../toolkit/utils/forms"

@Component({
  selector: 'page-edit-contracts',
  templateUrl: './contracts-edit-page.html',
})
export class ContractsEditPage {
  form: FormGroup

  contract: Contract

  seasons$: Observable<Season[]>

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public formBuilder: FormBuilder,
              private seasonService: SeasonService) {

    this.initializeForm()

    this.seasons$ = this.seasonService.lastSeasons$(2)
  }

  private initializeForm() {
    this.form = this.formBuilder.group({
      season: [null, Validators.required],
      sections: this.formBuilder.array(
        [ContractKind.VEGETABLES, ContractKind.EGGS].map(kind => {
          let section = this.formBuilder.group({
            kind: [kind, Validators.required],
            formula: [1, Validators.required],
            firstWeek: [1, Validators.required],
            lastWeek: null,
          })
          Forms.forceCastAsNumberOrNull(section.get('firstWeek'))
          Forms.forceCastAsNumberOrNull(section.get('lastWeek'))
          return section
        })
      ),
      wish: true,
      validation: this.formBuilder.group({
        paperCopies: this.formBuilder.group({
          forAssociation: false,
          forFarmer: false,
        }),
        cheques: this.formBuilder.group({
          membership: false,
          vegetables: false,
          eggs: false,
        }),
        validatedBy: ['', Validators.required],
      }, {
        validator: Validators.required
      }),
    })
  }

  ionViewWillLoad() {

    let wishControl = this.form.get('wish')
    this.wishValueChanged(wishControl.value)
    wishControl.valueChanges.subscribe(v => {
      this.wishValueChanged(v)
    })

    if (this.navParams.data) {
      this.contract = this.navParams.data.contract
      this.form.patchValue(this.contract)
    }
  }

  private wishValueChanged(v) {
    let validation = this.form.get('validation')
    if (v) validation.disable()
    else validation.enable()
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  save() {
    this.viewCtrl.dismiss(objectAssignNoNulls({}, this.contract, this.form.value))
  }

  formulas = [
    {
      value: 2,
      label: "2 every week"
    },
    {
      value: 1.5,
      label: "alternating 2 and 1"
    },
    {
      value: 1,
      label: "1 every week"
    },
    {
      value: .5,
      label: "1 every other week"
    },
    {
      value: 0,
      label: "none"
    },
  ]

  formulasFor(kind: string) {
    return this.formulas
  }
}
