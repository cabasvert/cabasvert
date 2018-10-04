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

import { Type } from '@angular/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { SelectInterface } from '@ionic/core';
import { Observable } from 'rxjs';
import { DynamicArrayComponent } from '../components/dynamic-array.component';
import { DynamicCheckboxComponent } from '../components/dynamic-checkbox.component';
import { DynamicControlComponent } from '../components/dynamic-control.component';
import { DynamicFormComponent } from '../components/dynamic-form.component';
import { DynamicGroupComponent } from '../components/dynamic-group.component';
import { DynamicHiddenInputComponent } from '../components/dynamic-hidden-input.component';
import { DynamicInputComponent } from '../components/dynamic-input.component';
import { DynamicSelectComponent } from '../components/dynamic-select.component';
import { DynamicTextareaComponent } from '../components/dynamic-textarea.component';
import { DynamicControl } from '../dynamic-form.service';

export interface ControlConfig {
  disabled?: ConfigFn<boolean | Observable<boolean>>;
  validator?: ValidatorFn | ValidatorFn[];
  asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[];
  errorLabels?: { [error: string]: string };
}

export interface ContainerConfig extends ControlConfig {
  controls: (ChildControlConfig & ComponentConfig)[];
}

export function form(config: FormConfig): FormConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicFormComponent,
  };
}

// noinspection TsLint
export interface FormConfig extends ContainerConfig {
}

export interface ChildControlConfig extends ControlConfig {
  label?: string;
  name: string;
  value?: any;
}

export function array(config: ArrayConfig): ArrayConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicArrayComponent,
  };
}

export interface ArrayConfig extends ChildControlConfig, ContainerConfig {
  icon?: string;
}

export function group(config: GroupConfig): GroupConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicGroupComponent,
  };
}

export interface GroupConfig extends ChildControlConfig, ContainerConfig {
  icon?: string;
}

export function checkbox(config: CheckboxConfig): CheckboxConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicCheckboxComponent,
  };
}

export interface CheckboxConfig extends ChildControlConfig {
  value?: boolean;
}

export function hiddenInput(config: HiddenInputConfig): HiddenInputConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicHiddenInputComponent,
  };
}

export interface HiddenInputConfig extends ChildControlConfig {
  value?: any;
  type?: string;
}

export function input(config: InputConfig): InputConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicInputComponent,
  };
}

export interface InputConfig extends ChildControlConfig {
  value?: any;
  placeholder?: string;
  type?: string;
}

export function select<T>(config: SelectConfig<T>): SelectConfig<T> & ComponentConfig {
  return {
    ...config,
    component: DynamicSelectComponent,
  };
}

export interface SelectConfig<T> extends ChildControlConfig {
  value?: any;
  placeholder?: string;
  interface?: SelectInterface;
  options: ConfigFn<T[] | Observable<T[]>>;
  nullOption?: boolean;
  optionLabel?: (option: T, index: number) => any;
  optionValue?: (option: T, index: number) => any;
}

export function textArea(config: TextAreaConfig): TextAreaConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicTextareaComponent,
  };
}

export interface TextAreaConfig extends ChildControlConfig {
  value?: any;
  placeholder?: string;
}

export interface ComponentConfig {
  component: Type<DynamicControlComponent<any>>;
}

export type ConfigFn<T> = ((form: DynamicControl, group: DynamicControl) => T) | T;
