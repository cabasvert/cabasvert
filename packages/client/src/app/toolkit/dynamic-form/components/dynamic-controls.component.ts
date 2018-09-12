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

import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { DynamicGroup } from '../dynamic-form.service';
import { GroupConfigBase } from '../models/form-config.interface';

@Component({
  selector: 'dynamic-controls',
  template: `
    <ion-item *ngFor="let error of errors;" style="font-size: small;">
      <ion-label color="danger" text-center>
        {{ config.errorLabels[error] | translate }}
      </ion-label>
    </ion-item>
    <ng-container *ngFor="let childConfig of config.controls;"
                  dynamicControlHost [config]="childConfig"
                  [form]="form" [group]="group"
                  [parentDisabled$]="parentDisabled$">
    </ng-container>
  `,
})
export class DynamicControlsComponent {

  @Input() config: GroupConfigBase;
  @Input() form: DynamicGroup;
  @Input() group: DynamicGroup;
  @Input() parentDisabled$?: Observable<boolean>;

  get errors() {
    let control = this.group.control;
    let errors = control.errors;
    return control.invalid && errors ?
      Object.keys(errors).filter(error => errors[error]) : null;
  }
}
