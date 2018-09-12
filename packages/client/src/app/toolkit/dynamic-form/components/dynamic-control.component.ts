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

import { Observable } from 'rxjs';
import { DynamicGroup } from '../dynamic-form.service';
import { ControlConfigBase } from '../models/form-config.interface';

export abstract class DynamicControlComponent<C extends ControlConfigBase> {
  config: C;
  group: DynamicGroup;
  form: DynamicGroup;

  initialize(config: C,
             group: DynamicGroup,
             form: DynamicGroup) {
    this.config = config;
    this.group = group;
    this.form = form;
  }

  abstract get dynamicControl()

  get control() {
    return this.dynamicControl.control;
  }

  get changes() {
    return this.control.valueChanges;
  }

  get valid() {
    return this.control.valid;
  }

  get value() {
    return this.control.value;
  }

  patchValue(value: any) {
    this.control.patchValue(value);
  }

  get problems() {
    let control = this.control;
    return control.invalid && control.errors ? control.errors : null;
  }

  get disabled$(): Observable<boolean> {
    return this.dynamicControl.disabled$;
  }
}
