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

import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input, OnChanges,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { DynamicGroup } from '../dynamic-form.service';
import { ControlConfig } from '../models/form-config.interface';
import { DynamicArrayComponent } from './dynamic-array.component';
import { DynamicCheckboxComponent } from './dynamic-checkbox.component';

import { DynamicControlComponent } from './dynamic-control.component';
import { DynamicGroupComponent } from './dynamic-group.component';
import { DynamicHiddenInputComponent } from './dynamic-hidden-input.component';
import { DynamicInputComponent } from './dynamic-input.component';
import { DynamicSelectComponent } from './dynamic-select.component';
import { DynamicTextareaComponent } from './dynamic-textarea.component';

import { FormButtonComponent } from './form-button.component';

const components: { [control: string]: Type<DynamicControlComponent<any>> } = {
  'array': DynamicArrayComponent,
  'group': DynamicGroupComponent,
  'checkbox': DynamicCheckboxComponent,
  'hidden-input': DynamicHiddenInputComponent,
  'input': DynamicInputComponent,
  'select': DynamicSelectComponent,
  'textarea': DynamicTextareaComponent,
};

@Directive({
  selector: '[dynamicControlHost]',
})
export class DynamicControlHostDirective implements OnChanges {
  @Input() config: ControlConfig;
  @Input() form: DynamicGroup;
  @Input() group: DynamicGroup;

  component: ComponentRef<DynamicControlComponent<any>>;

  constructor(private resolver: ComponentFactoryResolver,
              private container: ViewContainerRef) {
  }

  ngOnChanges() {
    let control = this.config.kind;

    if (!components[control]) {
      const supportedTypes = Object.keys(components).join(', ');
      throw new Error(
        `Trying to use an unsupported type (${control}).
        Supported types: ${supportedTypes}`,
      );
    }
    const factory = this.resolver.resolveComponentFactory<DynamicControlComponent<any>>(components[control]);
    this.component = this.container.createComponent(factory);
    this.component.instance.initialize(this.config, this.group, this.form);
  }
}
