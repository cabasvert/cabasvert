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

import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { publishBehavior, publishReplay, refCount, startWith } from 'rxjs/operators';
// import { ControlAccessor, GroupAccessor } from './models/form-accessor.interface';
import {
  BasicControlConfig,
  ControlConfig,
  ControlConfigBase,
  FormConfig,
  GroupConfigBase,
} from './models/form-config.interface';

@Injectable()
export class DynamicFormService {

  constructor(private fb: FormBuilder) {
  }

  public createForm(config: FormConfig) {
    let dynamicGroup = this.createGroup(config);
    dynamicGroup.scaffold(dynamicGroup, null);
    return dynamicGroup;
  }

  private createGroup(config: GroupConfigBase) {
    const { validator, asyncValidator } = config;
    const group = this.fb.group({}, { validator, asyncValidator });
    const dynamicGroup = new DynamicGroup(group, config);

    config.controls.forEach(controlConfig =>
      dynamicGroup.addControl(controlConfig.name, this.create(controlConfig)),
    );

    return dynamicGroup;
  }

  private createArray(config: GroupConfigBase) {
    const { validator, asyncValidator } = config;
    const array = this.fb.array([], validator, asyncValidator);
    const dynamicGroup = new DynamicArray(array, config);

    config.controls.forEach(controlConfig =>
      dynamicGroup.push(this.create(controlConfig)),
    );

    return dynamicGroup;
  }

  private create(config: ControlConfig) {
    if (config.kind === 'array') {
      return this.createArray(config);
    } else if (config.kind === 'group') {
      return this.createGroup(config);
    } else {
      return this.createControl(config);
    }
  }

  private createControl(config: BasicControlConfig) {
    const { value, validator, asyncValidator } = config;
    const control = this.fb.control(value, validator, asyncValidator);
    return new DynamicControl(control, config);
  }
}

export class DynamicControl {

  readonly value$: Observable<any>;

  private _subscription: Subscription;

  constructor(public control: AbstractControl, public _config: ControlConfigBase) {

    this.value$ = this.control.valueChanges.pipe(
      publishBehavior(this.control.value),
      refCount(),
    );

    this._subscription = this.value$.subscribe();
  }

  destroy() {
    this._subscription.unsubscribe();
  }

  scaffold(form: DynamicControl, group: DynamicControl) {
  }

  get(path: string): DynamicControl {
    let splitPath = path.split('.');

    let dynamicControl: DynamicControl = this;
    for (let index = 0; index < splitPath.length; index++) {
      let element = splitPath[index];

      if (dynamicControl instanceof DynamicGroup) {
        dynamicControl = (dynamicControl as DynamicGroup).controls.get(element);
      } else if (dynamicControl instanceof DynamicArray) {
        dynamicControl = (dynamicControl as DynamicArray).controls[parseInt(element)];
      } else return null;
    }

    return dynamicControl;
  }

  get value() {
    return this.control.value;
  }

  get valid() {
    return this.control.valid;
  }
}

export class DynamicArray extends DynamicControl {

  controls: DynamicControl[] = [];

  constructor(public control: FormArray, public _config: GroupConfigBase) {
    super(control, _config);
  }

  push(dynamicControl: DynamicControl) {
    this.controls.push(dynamicControl);
    this.control.push(dynamicControl.control);
  }

  destroy() {
    super.destroy();
    this.controls.forEach(dynamicControl =>
      dynamicControl.destroy(),
    );
  }

  scaffold(form: DynamicControl, group: DynamicControl) {
    super.scaffold(form, group);
    this.controls.forEach(dynamicControl =>
      dynamicControl.scaffold(form, this),
    );
  }

  patchValue(value: any) {
    this.control.patchValue(value, { onlySelf: false, emitEvent: true });
  }
}

export class DynamicGroup extends DynamicControl {

  controls = new Map<string, DynamicControl>();

  constructor(public control: FormGroup, public _config: GroupConfigBase) {
    super(control, _config);
  }

  addControl(name: string, dynamicControl: DynamicControl) {
    this.controls.set(name, dynamicControl);
    this.control.addControl(name, dynamicControl.control);
  }

  destroy() {
    super.destroy();
    this._config.controls.forEach(controlConfig =>
      this.controls.get(controlConfig.name).destroy(),
    );
  }

  scaffold(form: DynamicControl, group: DynamicControl) {
    super.scaffold(form, group);
    this._config.controls.forEach(controlConfig =>
      this.controls.get(controlConfig.name).scaffold(form, this),
    );
  }

  patchValue(value: any) {
    this.control.patchValue(value, { onlySelf: false, emitEvent: true });
  }
}
