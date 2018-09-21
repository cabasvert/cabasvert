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

import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ion-item-action',
  template: `
    <button>
      <ion-icon [name]="icon" [color]="color"></ion-icon>
      <ion-label [color]="color">{{ label }}</ion-label>
    </button>
  `,
  styleUrls: ['item-action.scss'],
})
export class ItemAction {

  @Output('click') click$ = new EventEmitter<Event>();

  @Input('icon') icon: string;
  @Input('label') label: string;
  @Input('color') color: string;

  constructor() {

  }
}
