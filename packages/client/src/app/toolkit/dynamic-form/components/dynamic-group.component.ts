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

import { Component } from '@angular/core';
import { ComponentConfig, GroupConfig } from '../models/form-config.interface';
import { DynamicChildControlComponent } from './dynamic-child-control.component';

@Component({
  selector: 'dynamic-group',
  template: `
    <ng-container [formGroup]="group.control">
      <ion-item-group [formGroupName]="config.name" [class.group-disabled]="disabled$ | async">
        <ion-item-divider *ngIf="config.label">
          <ion-icon *ngIf="config.icon" [name]="config.icon" slot="start"></ion-icon>
          <ion-label>{{ config.label | translate }}</ion-label>
        </ion-item-divider>

        <dynamic-controls [config]="config"
                          [form]="form" [group]="group.get(config.name)">
        </dynamic-controls>
      </ion-item-group>
    </ng-container>
  `,
  styles: [
    '.group-disabled ion-item-divider * { cursor: default; opacity: .3; }'
  ],
})
export class DynamicGroupComponent extends DynamicChildControlComponent<GroupConfig & ComponentConfig> {
}
