import { Component } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"

import { NavParams, ViewController } from "ionic-angular"
import { Person } from "./member.model"
import { objectAssignNoNulls } from "../../utils/objects"

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
              public formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      address: null,
      phoneNumber: null,
      emailAddress: null,
    })
  }

  ionViewDidLoad() {
    if (this.navParams.data) {
      this.title = this.navParams.data.title
      this.person = this.navParams.data.person
      this.form.patchValue(this.person)
    }
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  save() {
    this.viewCtrl.dismiss(objectAssignNoNulls({}, this.person, this.form.value))
  }
}
