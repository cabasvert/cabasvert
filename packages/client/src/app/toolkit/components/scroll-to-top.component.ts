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

import { Component, ElementRef, HostBinding, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Content } from '@ionic/angular';
import { ScrollDetail } from '@ionic/core';
import { defer, merge, Subscription, timer } from 'rxjs';
import { filter, switchMap, switchMapTo } from 'rxjs/operators';

const VISIBILITY_DURATION = 2000;

@Component({
  selector: 'scroll-to-top',
  templateUrl: './scroll-to-top.component.html',
  styleUrls: ['./scroll-to-top.component.scss'],
})
export class ScrollToTop implements OnInit, OnDestroy {

  _visible = false;

  @HostBinding('attr.slot') private readonly slot = 'fixed';

  private _scrollSelfInitiated = false;

  private subscription: Subscription = new Subscription();

  constructor(private content: Content,
              private elementRef: ElementRef,
              private zone: NgZone) {
  }

  ngOnInit() {
    this.setupScrollListener();
  }

  private async setupScrollListener() {
    let show$ = defer(() => this._setVisible(true));
    let hide$ = defer(() => this._setVisible(false));
    let ionScroll = this.content.ionScroll;

    this.content.scrollEvents = true;
    this.subscription.add(
      ionScroll.pipe(
        filter(e => !this._scrollSelfInitiated),
        switchMap((e: CustomEvent<ScrollDetail>) =>
          e.detail.scrollTop === 0 ? hide$ :
            merge(show$, timer(VISIBILITY_DURATION).pipe(switchMapTo(hide$))),
        ),
      ).subscribe(),
    );
  }

  _setVisible(visible: boolean): void {
    if (this._visible !== visible) {
      this.zone.run(() => {
        this._visible = visible;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  async scrollToTop() {
    if (!this._visible) return;

    this._scrollSelfInitiated = true;
    await this.content.scrollToTop(300);
    this._scrollSelfInitiated = false;
  }
}
