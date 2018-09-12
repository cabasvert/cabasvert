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
import { Observable, of } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { SelectConfig } from '../models/form-config.interface';
import { DynamicChildControlComponent } from './dynamic-child-control.component';

@Component({
  selector: 'dynamic-select',
  template: `
    <ion-item [formGroup]="group.control">
      <ion-label color="primary">{{ config.label | translate }}</ion-label>
      <ion-select [formControlName]="config.name"
                  [placeholder]="config.placeholder"
                  [interface]="config.interface || 'popover'">
        <ion-select-option *ngFor="let option of (options$ | async); let index=index;"
                           [value]="optionValue(option, index)">
          {{ optionLabel(option, index) }}
        </ion-select-option>
      </ion-select>

      <ion-label color="danger" slot="end" style="font-size: xx-small;"
                 *ngIf="problems">
        <span *ngIf="problems['required']">{{ 'DIALOGS.REQUIRED' | translate }}</span>
      </ion-label>
    </ion-item>
  `,
})
export class DynamicSelectComponent extends DynamicChildControlComponent<SelectConfig<any>> implements OnInit {

  options$: Observable<any[]>;

  ngOnInit() {
    let options = this.config.options;

    if (options instanceof Function) options = options(this.form, this.group);

    this.options$ = (options instanceof Observable ? options : of(options)).pipe(
      map(os => {
        if (this.config.nullOption) {
          os = os.slice();
          os.unshift(null);
        }
        return os;
      }),
      publishReplay(1),
      refCount(),
    );
  }

  optionLabel(option: any, index: number) {
    let optionLabelFn = this.config.optionLabel;
    return optionLabelFn ? optionLabelFn(option, index) : option;
  }

  optionValue(option: any, index: number) {
    let optionValueFn = this.config.optionValue;
    return optionValueFn ? optionValueFn(option, index) : option;
  }
}
