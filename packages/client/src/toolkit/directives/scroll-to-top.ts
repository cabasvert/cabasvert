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

import { Directive, NgZone, OnDestroy, OnInit } from "@angular/core"
import { Content, ScrollEvent } from "ionic-angular"
import { defer } from "rxjs/observable/defer"
import { delay, filter, switchMap, switchMapTo } from "rxjs/operators"
import { Subscription } from "rxjs/Subscription"

const VISIBILITY_DURATION = 2000

@Directive({
  selector: '[scroll-to-top]',
  host: {
    '[class]': "'scroll-to-top-fab'",
    '[class.visible]': "_visible",
    '(click)': "scrollToTop()",
  }
})
export class ScrollToTopDirective implements OnInit, OnDestroy {

  constructor(private content: Content,
              private zone: NgZone) {
  }

  _visible: boolean = false

  private _scrollSelfInitiated: boolean = false

  private subscription: Subscription = new Subscription()

  ngOnInit(): void {
    let show$ = defer(() => this._setVisible(true))
    let hide$ = defer(() => this._setVisible(false))

    this.subscription.add(
      this.content.ionScroll.pipe(
        filter(e => !this._scrollSelfInitiated || (!!e && e.scrollTop == 0)),
        switchMap((e: ScrollEvent) => {
            if (!!e && e.scrollTop == 0) {
              return hide$
            } else {
              return show$.pipe(delay(VISIBILITY_DURATION), switchMapTo(hide$))
            }
          }
        ),
      ).subscribe()
    )
  }

  _setVisible(visible: boolean): void {
    if (this._visible != visible) {
      this.zone.run(() => {
        this._visible = visible
      })
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe()
  }

  scrollToTop() {
    if (!this._visible) return

    this._scrollSelfInitiated = true
    this.content.scrollToTop().then(() => {
      this._scrollSelfInitiated = false
    })
  }
}
