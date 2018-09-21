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

import { AfterContentInit, Component, ContentChildren, HostBinding, Input, QueryList } from '@angular/core';
import { SlidingPane } from './sliding-pane';

@Component({
  selector: 'sliding-panes',
  template: `
    <div class="sliding-panes-slider"
         [style.width]="_paneCount * 100 + '%'"
         [style.transform]="'translate(-' + (_perNamePaneIndex[selectedPane] * 100 / _paneCount) + '%, 0)'">
      <ng-content select="sliding-pane"></ng-content>
    </div>
  `,
  styleUrls: ['./sliding-panes.scss'],
})
export class SlidingPanes implements AfterContentInit {

  @Input() selectedPane: string;

  @ContentChildren(SlidingPane) private _panes: QueryList<SlidingPane>;

  _paneCount: number;
  _perNamePaneIndex: { [name: string]: number };

  @HostBinding('attr.slot') private readonly slot = 'fixed';

  constructor() {
  }

  ngAfterContentInit(): void {
    this.updatePaneSizes();
  }

  private updatePaneSizes() {
    this._paneCount = this._panes.length;

    this._perNamePaneIndex = {};
    var index = 0;
    this._panes.forEach(pane => {
      this._perNamePaneIndex[pane.name] = index++;
      pane.setWidth(100 / this._paneCount);
    });
  }
}
