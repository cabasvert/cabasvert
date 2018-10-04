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
import { AsyncValidatorFn, Validators } from '@angular/forms';

import { ModalController, NavParams } from '@ionic/angular';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { EditFormComponent } from '../../toolkit/dialogs/edit-form.interface';
import { DynamicFormService, DynamicGroup } from '../../toolkit/dynamic-form/dynamic-form.service';
import * as forms from '../../toolkit/dynamic-form/models/form-config.interface';
import { objectAssignNoNulls } from '../../utils/objects';
import { Person } from './member.model';
import { MemberService } from './member.service';

@Component({
  selector: 'person-edit-form',
  templateUrl: 'person-edit-form.component.html',
})
export class PersonEditFormComponent implements EditFormComponent {

  config = forms.form({
    controls: [
      forms.input({
        name: 'firstname',
        label: 'PERSON.FIRSTNAME',
        type: 'text',
        validator: Validators.required,
      }),
      forms.input({
        name: 'lastname',
        label: 'PERSON.LASTNAME',
        type: 'text',
        validator: Validators.required,
      }),
      forms.textArea({
        name: 'address',
        label: 'PERSON.ADDRESS',
      }),
      forms.input({
        name: 'phoneNumber',
        label: 'PERSON.PHONE_NUMBER',
        type: 'tel',
      }),
      forms.input({
        name: 'emailAddress',
        label: 'PERSON.EMAIL_ADDRESS',
        type: 'email',
      }),
    ],
    asyncValidator: this.personDoesNotAlreadyExist,
    errorLabels: {
      'memberAlreadyExists': 'PERSON.PROBLEM_MEMBER_PERSON_ALREADY_EXISTS',
    },
  });

  form: DynamicGroup;

  title: string;
  person: Person;

  private isNewPerson: boolean;

  constructor(private navParams: NavParams,
              private modalController: ModalController,
              private dynamicFormService: DynamicFormService,
              private members: MemberService) {

    this.form = this.dynamicFormService.createForm(this.config);
  }

  set data(data: any) {
    this.title = data.title;
    this.person = data.person;
    this.isNewPerson = data.isNewPerson;

    this.form.patchValue(this.person);
  }

  get data() {
    return objectAssignNoNulls({}, this.person, this.form.value);
  }

  get valid() {
    return this.form.valid;
  }

  get personDoesNotAlreadyExist(): AsyncValidatorFn {
    return c => {
      if (!this.isNewPerson) return of(null);

      const lastname = c.get('lastname');
      const firstname = c.get('firstname');

      if (!lastname.value || !firstname.value) {
        return of(null);
      }

      return this.members.memberByNames$(lastname.value, firstname.value).pipe(
        map(m => !m ? null : { 'memberAlreadyExists': true }),
        take(1),
      );
    };
  }
}
