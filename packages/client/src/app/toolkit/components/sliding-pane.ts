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

import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'sliding-pane',
  template: `
    <ng-content></ng-content>
  `,
})
export class SlidingPane {

  @Input() name: string;

  @HostBinding('style.display') private styleDisplay = 'inline-block';
  @HostBinding('style.height') private styleHeight = '100%';
  @HostBinding('style.width') private get styleWidth() {
    return this._width + '%';
  }

  _width: number;

  setWidth(width: number) {
    this._width = width;
  }
}
