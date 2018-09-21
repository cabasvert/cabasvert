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

import { Component } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ModalController, NavParams } from '@ionic/angular';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { EditFormComponent } from '../../toolkit/dialogs/edit-form.interface';
import { objectAssignNoNulls } from '../../utils/objects';
import { Person } from './member.model';
import { MemberService } from './member.service';

@Component({
  selector: 'person-edit-form',
  templateUrl: 'person-edit-form.component.html',
})
export class PersonEditFormComponent implements EditFormComponent {
  form: FormGroup;

  title: string;
  person: Person;
  private isNewPerson: boolean;

  constructor(public navParams: NavParams,
              public modalController: ModalController,
              public formBuilder: FormBuilder,
              private members: MemberService) {

    this.form = this.formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      address: null,
      phoneNumber: null,
      emailAddress: null,
    }, { asyncValidator: this.personDoesNotAlreadyExist });
  }

  set data(data: any) {
    this.title = data.title;
    this.person = data.person;
    this.isNewPerson = data.isNewPerson;

    this.form.patchValue(this.person);
  }

  get isValid() {
    return this.form.valid;
  }

  get editedData() {
    return objectAssignNoNulls({}, this.person, this.form.value);
  }

  get problems() {
    return this.problemsForControl(this.form);
  }

  problemsFor(path: string) {
    const control = this.form.get(path);
    return this.problemsForControl(control);
  }

  private problemsForControl(control) {
    return (control.invalid && control.errors) ?
      control.errors : null;
  }

  personDoesNotAlreadyExist: AsyncValidatorFn = c => {
    if (!this.isNewPerson) return of(null);

    const lastname = c.get('lastname');
    const firstname = c.get('firstname');

    if (!lastname.value || !firstname.value) {
      return of(null);
    }

    return this.members.getMember$(lastname.value, firstname.value).pipe(
      map(m => !m ? null : { 'memberAlreadyExists': true }),
      take(1),
    );
  };
}
