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

import { AfterContentInit, Component, ElementRef, HostBinding, HostListener, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Content } from '@ionic/angular';

import Hammer from 'hammerjs';
import { combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount, startWith } from 'rxjs/operators';
import { observeInsideAngular } from '../../utils/observables';

const MARGIN = 15;
const RIGHT_MARGIN = 10;
const SCROLLER_WIDTH = 20;
const PADDING = 5;
const BORDER = .5;
const FAB_RADIUS = 72 / 2;
const ORIGINAL_FAB_RADIUS = 56 / 2;
const BAR_HALF_HEIGHT = 20;
const FONT_LINE_HEIGHT = 17;

class Rect {
  left: number;
  width: number;
  top: number;
  height: number;

  get right() {
    return this.left + this.width;
  }

  get bottom() {
    return this.top + this.height;
  }
}

@Component({
  selector: 'indexed-scroller',
  templateUrl: './indexed-scroller.html',
  styleUrls: ['./indexed-scroller.scss'],
})
export class IndexedScroller implements OnInit, OnDestroy, AfterContentInit {

  constructor(private content: Content,
              private zone: NgZone,
              private elementRef: ElementRef) {
  }

  @HostBinding('attr.slot') private readonly slot = 'fixed';

  @HostBinding('style.height.px') private get styleHeight() {
    return this._height;
  }

  @Input() indexesLabels: string[];

  shortenIndexesLabels: string[];

  scrollToIndex$: Observable<number>;
  scrollToLabel$: Observable<string>;
  scrolling$: Observable<boolean>;

  private _gestureEvent$: Subject<{ x: number, y: number, scrolling: boolean, immediate?: boolean }> = new Subject();

  _data$: Observable<{ scrolling: boolean, immediate?: boolean, index: number, fabTop: number, barTop: number }>;

  _height: number;
  private _rect: ClientRect;
  private _viewIsActive: boolean;

  private _hammer;

  private pan = e => {
    this._gestureEvent$.next({
      x: e.center.x,
      y: e.center.y,
      scrolling: !e.isFinal,
      immediate: false,
    });
  };

  private press = e => {
    this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: true, immediate: false });
  };

  private pressup = e => {
    this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: false, immediate: false });
  };

  private tap = e => {
    this._gestureEvent$.next({ x: e.center.x, y: e.center.y, scrolling: false, immediate: true });
  };

  ngOnInit(): void {
    let element = this.elementRef.nativeElement;
    this._hammer = new Hammer.Manager(element, {
      recognizers: [
        [Hammer.Pan, { direction: Hammer.DIRECTION_VERTICAL }],
        [Hammer.Press],
        [Hammer.Tap],
      ],
    });

    this._hammer.on('pan', this.pan);
    this._hammer.on('press', this.press);
    this._hammer.on('pressup', this.pressup);
    this._hammer.on('tap', this.tap);

    const scrolling$ = this._gestureEvent$.pipe(
      map(e => e.scrolling),
      startWith(false),
      distinctUntilChanged(),
    );

    const eventsInBounds$ = this._gestureEvent$.pipe(
      filter(e =>
        (e.x >= this._rect.right - (RIGHT_MARGIN + SCROLLER_WIDTH) && e.x <= this._rect.right &&
          e.y >= this._rect.top && e.y <= this._rect.bottom),
      ),
    );

    this._data$ = combineLatest(eventsInBounds$, scrolling$).pipe(
      map(([e, scrolling]) => {
        const { y, immediate, ..._ } = e;

        let percent = (y - (this._rect.top + PADDING + MARGIN + BORDER)) / (this._height - 2 * PADDING);
        if (percent < 0) {
          percent = 0;
        } else if (percent > 1) {
          percent = 1;
        }

        let index = Math.floor(this.indexesLabels.length * percent);
        if (index === this.indexesLabels.length) {
          index -= 1;
        }

        let fabTop = y - (this._rect.top + MARGIN + FAB_RADIUS);
        const fabBound = this._height - 2 * FAB_RADIUS;
        if (fabTop < 0) {
          fabTop = 0;
        } else if (fabTop > fabBound) {
          fabTop = fabBound;
        }
        fabTop += MARGIN + FAB_RADIUS - ORIGINAL_FAB_RADIUS;

        let barTop = y - (this._rect.top + MARGIN + BORDER + BAR_HALF_HEIGHT);
        const barBound = this._height - 2 * (BORDER + BAR_HALF_HEIGHT);
        if (barTop < 0) {
          barTop = 0;
        } else if (barTop > barBound) {
          barTop = barBound;
        }
        barTop += MARGIN + BORDER;

        return { scrolling, immediate, index, fabTop, barTop };
      }),
      observeInsideAngular(this.zone),
      publishReplay(1),
      refCount(),
    );

    this.scrolling$ = this._data$.pipe(
      distinctUntilChanged((d1, d2) => d1.scrolling === d2.scrolling || d1.immediate || d2.immediate),
      map(d => d.scrolling),
      publishReplay(1),
      refCount(),
    );

    this.scrollToIndex$ = this._data$.pipe(
      distinctUntilChanged((d1, d2) => d1.index === d2.index && !(d1.immediate || d2.immediate)),
      map(d => d.index),
      publishReplay(1),
      refCount(),
    );

    this.scrollToLabel$ = this.scrollToIndex$.pipe(
      map(i => this.indexesLabels[i]),
    );
  }

  ngAfterContentInit() {
    setTimeout(() => {
      this._viewIsActive = true;
      this._updateAspect();
    });
  }

  ngOnDestroy() {
    if (this._hammer) {
      this._hammer.off('pan', this.pan);
      this._hammer.off('press', this.press);
      this._hammer.off('pressup', this.pressup);
      this._hammer.off('tap', this.tap);

      this._hammer.destroy();
      this._hammer = null;
    }
    this._viewIsActive = false;
  }

  @HostListener('window:resize')
  resize() {
    if (this._viewIsActive) {
      setTimeout(() => {
        this._updateAspect();
      });
    }
  }

  private async _updateAspect() {
    let scrollElement: HTMLElement = await this.content.getScrollElement();
    let clientHeight = scrollElement.clientHeight;

    this._rect = scrollElement.getBoundingClientRect();

    if (clientHeight === 0) return;

    // Account for 5px top and 5px bottom margins
    const height = clientHeight - MARGIN * 2;
    const shortenIndexesLabels = this._computeShortenIndexesLabels(height);

    this.zone.run(() => {
      this.shortenIndexesLabels = shortenIndexesLabels;
      this._height = height;
    });
  }

  private _computeShortenIndexesLabels(height) {
    // Approximate number of lines for a line-height of 17px with 5px top and 5px bottom padding
    const lines = (height - MARGIN * 2) / FONT_LINE_HEIGHT;

    // Compute a list of indexes that fit the current height

    let indexesCount = this.indexesLabels.length;
    let indexesJump = 1;
    while (lines < indexesCount) {
      indexesCount = indexesCount / 2;
      indexesJump = indexesJump * 2;
    }
    if (indexesJump !== 1) {
      indexesJump = indexesJump * 2;
    }

    const shortenIndexesLabels = [];
    for (let i = 0; i < this.indexesLabels.length; i += indexesJump) {
      shortenIndexesLabels.push(this.indexesLabels[i]);
      if (indexesJump !== 1) {
        shortenIndexesLabels.push('∙');
      }
    }
    return shortenIndexesLabels;
  }
}
