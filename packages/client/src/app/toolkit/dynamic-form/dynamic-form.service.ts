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
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { map, publishBehavior, refCount } from 'rxjs/operators';
import { DynamicArrayComponent } from './components/dynamic-array.component';
import { DynamicGroupComponent } from './components/dynamic-group.component';
import {
  ChildControlConfig,
  ComponentConfig,
  ControlConfig,
  FormConfig,
  ContainerConfig,
} from './models/form-config.interface';

@Injectable()
export class DynamicFormService {

  constructor(private fb: FormBuilder) {
  }

  public createForm(config: FormConfig & ComponentConfig) {
    let dynamicGroup = this.createGroup(config);
    dynamicGroup.initialize(dynamicGroup, dynamicGroup);
    return dynamicGroup;
  }

  private createGroup(config: ContainerConfig & ComponentConfig) {
    const { validator, asyncValidator } = config;
    const group = this.fb.group({}, { validator, asyncValidator });
    const dynamicGroup = new DynamicGroup(group, config);

    config.controls.forEach(controlConfig =>
      dynamicGroup.addControl(controlConfig.name, this.create(controlConfig)),
    );

    return dynamicGroup;
  }

  private createArray(config: ContainerConfig & ComponentConfig) {
    const { validator, asyncValidator } = config;
    const array = this.fb.array([], validator, asyncValidator);
    const dynamicGroup = new DynamicArray(array, config);

    config.controls.forEach(controlConfig =>
      dynamicGroup.push(this.create(controlConfig)),
    );

    return dynamicGroup;
  }

  private create(config: ChildControlConfig & ComponentConfig) {
    if (config.component === DynamicArrayComponent) {
      return this.createArray(config as any);
    } else if (config.component === DynamicGroupComponent) {
      return this.createGroup(config as any);
    } else {
      return this.createControl(config);
    }
  }

  private createControl(config: ChildControlConfig & ComponentConfig) {
    const { value, validator, asyncValidator } = config;
    const control = this.fb.control(value, validator, asyncValidator);
    return new DynamicControl(control, config);
  }
}

export class DynamicControl {

  readonly value$: Observable<any>;
  private _disabled$: Observable<boolean>;

  private _subscription = new Subscription();

  constructor(public control: AbstractControl, public _config: ControlConfig & ComponentConfig) {

    this.value$ = this.control.valueChanges.pipe(
      publishBehavior(this.control.value),
      refCount(),
    );

    this._subscription.add(this.value$.subscribe());
  }

  initialize(form: DynamicControl, group: DynamicControl) {
    this._disabled$ = this.setupDisabled$(form, group);

    if (this._disabled$) {
      let control = this.control;

      this._subscription.add(this._disabled$.subscribe(disabled => {
        const method = disabled ? 'disable' : 'enable';
        control[method]();
      }));
    }
  }

  private setupDisabled$(form: DynamicControl, group: DynamicControl): Observable<boolean> {
    let disabled$ = this.setupImmediateDisabled$(form, group);

    if (group._disabled$) {
      if (disabled$) {
        disabled$ = combineLatest(disabled$, group._disabled$).pipe(
          map(([b1, b2]) => b1 || b2),
        );
      } else {
        disabled$ = group._disabled$;
      }
    }

    return disabled$;
  }

  private setupImmediateDisabled$(form: DynamicControl, group: DynamicControl): Observable<boolean> {
    let disabled = this._config.disabled;
    if (!disabled) return null;

    if (disabled instanceof Function) disabled = disabled(form, group);

    if (disabled instanceof Observable) return disabled;
    else return of(disabled);
  }

  destroy() {
    this._subscription.unsubscribe();
  }

  get(path: string): DynamicControl {
    let splitPath = path.split('.');

    let dynamicControl: DynamicControl = this;
    for (let index = 0; index < splitPath.length; index++) {
      let element = splitPath[index];

      if (dynamicControl instanceof DynamicGroup) {
        dynamicControl = (dynamicControl as DynamicGroup).controls.get(element);
      } else if (dynamicControl instanceof DynamicArray) {
        dynamicControl = (dynamicControl as DynamicArray).controls[parseInt(element, 10)];
      } else return null;
    }

    return dynamicControl;
  }

  get value() {
    return this.control.value;
  }

  patchValue(value: any) {
    this.control.patchValue(value);
  }

  get disabled$() {
    return this._disabled$;
  }

  get valid() {
    return this.control.valid;
  }

  get valid$() {
    return this.control.valueChanges.pipe(
      map(() => this.control.valid),
    );
  }
}

export class DynamicArray extends DynamicControl {

  controls: DynamicControl[] = [];

  constructor(public control: FormArray, public _config: ContainerConfig & ComponentConfig) {
    super(control, _config);
  }

  push(dynamicControl: DynamicControl) {
    this.controls.push(dynamicControl);
    this.control.push(dynamicControl.control);
  }

  initialize(form: DynamicControl, group: DynamicControl) {
    super.initialize(form, group);
    this.controls.forEach(dynamicControl =>
      dynamicControl.initialize(form, this),
    );
  }

  destroy() {
    super.destroy();
    this.controls.forEach(dynamicControl =>
      dynamicControl.destroy(),
    );
  }

  patchValue(value: any) {
    this.control.patchValue(value, { onlySelf: false, emitEvent: true });
  }
}

export class DynamicGroup extends DynamicControl {

  controls = new Map<string, DynamicControl>();

  constructor(public control: FormGroup, public _config: ContainerConfig & ComponentConfig) {
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

  initialize(form: DynamicControl, group: DynamicControl) {
    super.initialize(form, group);
    this._config.controls.forEach(controlConfig =>
      this.controls.get(controlConfig.name).initialize(form, this),
    );
  }

  patchValue(value: any) {
    this.control.patchValue(value, { onlySelf: false, emitEvent: true });
  }
}
