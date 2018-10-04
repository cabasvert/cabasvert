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

import { Component, OnInit } from '@angular/core';
import { Forms } from '../../utils/forms';
import { ComponentConfig, InputConfig } from '../models/form-config.interface';
import { DynamicChildControlComponent } from './dynamic-child-control.component';

@Component({
  selector: 'dynamic-input',
  template: `
    <dynamic-item [formGroup]="group.control" [label]="config.label" [problems]="problems">
      <ion-input
        [type]="config.type"
        [placeholder]="config.placeholder"
        [formControlName]="config.name">
      </ion-input>
    </dynamic-item>
  `,
})
export class DynamicInputComponent extends DynamicChildControlComponent<InputConfig & ComponentConfig> implements OnInit {

  ngOnInit() {
    if (this.config.type === 'number') {
      Forms.forceCastAsNumberOrNull(this.control);
    }
  }
}
