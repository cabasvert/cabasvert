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

import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { SelectInterface } from '@ionic/core';
import { Observable } from 'rxjs';
import { DynamicControl } from '../dynamic-form.service';

export interface ControlConfigBase {
  disabled?: ConfigFn<boolean | Observable<boolean>>;
  validator?: ValidatorFn | ValidatorFn[];
  asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[];
  errorLabels?: { [error: string]: string };
}

export interface GroupConfigBase extends ControlConfigBase {
  controls: ControlConfig[];
}

// noinspection TsLint
export interface FormConfig extends GroupConfigBase {
}

export type ControlConfig =
  | ArrayConfig
  | GroupConfig
  | BasicControlConfig
  ;

export type BasicControlConfig =
  | CheckboxConfig
  | HiddenInputConfig
  | InputConfig
  | SelectConfig<any>
  | TextAreaConfig
  ;

export interface ChildConfigBase extends ControlConfigBase {
  label?: string;
  name: string;
}

export interface ArrayConfig extends ChildConfigBase, GroupConfigBase {
  kind: 'array';

  icon?: string;
}

export interface GroupConfig extends ChildConfigBase, GroupConfigBase {
  kind: 'group';

  icon?: string;
}

export interface CheckboxConfig extends ChildConfigBase {
  kind: 'checkbox';

  value?: boolean;
}

export interface HiddenInputConfig extends ChildConfigBase {
  kind: 'hidden-input';

  value?: any;
  type?: string;
}

export interface InputConfig extends ChildConfigBase {
  kind: 'input';

  value?: any;
  placeholder?: string;
  type?: string;
}

export interface SelectConfig<T> extends ChildConfigBase {
  kind: 'select';

  value?: any;
  placeholder?: string;
  interface?: SelectInterface;
  options: ConfigFn<T[] | Observable<T[]>>;
  nullOption?: boolean;
  optionLabel?: (option: T, index: number) => string;
  optionValue?: (option: T, index: number) => string;
}

export interface TextAreaConfig extends ChildConfigBase {
  kind: 'textarea';

  value?: any;
  placeholder?: string;
}

export type ConfigFn<T> = ((form: DynamicControl, group: DynamicControl) => T) | T;
