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

import { Directive, OnDestroy, OnInit } from '@angular/core'
import { Content, ViewController } from "ionic-angular"
import { Subscription } from "rxjs/Subscription"

@Directive({
  selector: '[elastic]',
  host: {
    '[class]': "'elastic-textarea'",
    '[style.height]': "_height + 'px'"
  }
})
export class ElasticDirective implements OnInit, OnDestroy {

  constructor(private viewCtrl: ViewController,
              private content: Content) {
  }

  _height: number

  _subscription = new Subscription()

  ngOnInit() {
    this._subscription.add(
      this.viewCtrl.willEnter
        .subscribe(() => {
          this._height = this.content.getContentDimensions().contentHeight
        })
    )
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe()
  }
}
