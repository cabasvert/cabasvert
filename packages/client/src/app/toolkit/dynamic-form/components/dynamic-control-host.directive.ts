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
  Input,
  OnChanges,
  ViewContainerRef,
} from '@angular/core';
import { DynamicGroup } from '../dynamic-form.service';
import { ChildControlConfig, ComponentConfig } from '../models/form-config.interface';

import { DynamicControlComponent } from './dynamic-control.component';

import { FormButtonComponent } from './form-button.component';

@Directive({
  selector: '[dynamicControlHost]',
})
export class DynamicControlHostDirective implements OnChanges {
  @Input() config: ChildControlConfig & ComponentConfig;
  @Input() form: DynamicGroup;
  @Input() group: DynamicGroup;

  component: ComponentRef<DynamicControlComponent<any>>;

  constructor(private resolver: ComponentFactoryResolver,
              private container: ViewContainerRef) {
  }

  ngOnChanges() {
    let type = this.config.component;
    const factory = this.resolver.resolveComponentFactory<DynamicControlComponent<any>>(type);
    this.component = this.container.createComponent(factory);
    this.component.instance.initialize(this.config, this.group, this.form);
  }
}
