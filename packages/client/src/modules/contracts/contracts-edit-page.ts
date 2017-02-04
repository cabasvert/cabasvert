import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"

import { NavParams, ViewController } from "ionic-angular"
import { objectAssignNoNulls } from "../../utils/objects"
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

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      season: ['season:2017S', Validators.required],
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
      wish: false,
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
    this.form.get('wish').valueChanges.subscribe(v => {
      let validation = this.form.get('validation')
      if (v) validation.disable()
      else validation.enable()
    })

    if (this.navParams.data) {
      this.contract = this.navParams.data.contract
      this.form.patchValue(this.contract)
    }
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
