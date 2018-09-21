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

import { Attribute, Directive, ElementRef, HostBinding, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';

@Directive({ selector: '[showOnMedia]' })
export class ShowOnMediaDirective {

  @HostBinding('style.display') styleDisplay = 'none';

  constructor(@Attribute('showOnMedia') private media: string) {
    this.checkIfDisplayed();
  }

  @HostListener('window:resize')
  private onResize() {
    this.checkIfDisplayed();
  }

  private checkIfDisplayed() {
    let mediaQuery =
      this.media === 'sm' ? 'screen and (min-width:576px)' :
        this.media === 'md' ? 'screen and (min-width:768px)' :
          this.media === 'lg' ? 'screen and (min-width:992px)' :
            this.media === 'xl' ? 'screen and (min-width:1200px)' :
              this.media;

    let matches = window.matchMedia(mediaQuery).matches;
    this.styleDisplay = matches ? null : 'none';
  }
}
