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

@Component({
  selector: 'dynamic-item',
  template: `
    <ion-item [formGroup]="formGroup">
      <ion-label color="primary">{{ label | translate }}</ion-label>

      <ng-content></ng-content>

      <ion-label *ngIf="problems && problems['required']"
                 color="danger" slot="end" class="required">
        <span *ngIf="problems['required']">{{ 'DIALOGS.REQUIRED' | translate }}</span>
      </ion-label>
    </ion-item>
  `,
  styles: [
    'ion-label.required { font-size: xx-small; margin-right: 0; flex: 0 0 auto; }',
  ],
})
export class DynamicItemComponent {

  @Input() formGroup;
  @Input() label;
  @Input() problems;
}
