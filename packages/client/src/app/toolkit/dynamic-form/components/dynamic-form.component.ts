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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DynamicFormService, DynamicGroup } from '../dynamic-form.service';

import { FormConfig } from '../models/form-config.interface';
import { DynamicControlComponent } from './dynamic-control.component';

@Component({
  exportAs: 'dynamicForm',
  selector: 'dynamic-form',
  template: `
    <form [formGroup]="form.control" (submit)="handleSubmit($event)">
      <ion-list inset>
        <dynamic-controls [config]="config"
                          [form]="form" [group]="form"
                          [parentDisabled$]="disabled$">
        </dynamic-controls>
      </ion-list>
    </form>
  `,
})
export class DynamicFormComponent extends DynamicControlComponent<FormConfig> implements OnInit {

  @Input() config: FormConfig = {
    controls: [],
  };

  @Input() form: DynamicGroup;

  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  get dynamicControl() {
    return this.form;
  }

  constructor(private dynamicFormService: DynamicFormService) {
    super();
  }

  ngOnInit() {
    if (!this.form) this.form = this.dynamicFormService.createForm(this.config);
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.submit.emit(this.value);
  }
}
