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

import {Directive, ElementRef, OnInit, OnDestroy, Output, EventEmitter} from '@angular/core';
import {Gesture} from 'ionic-angular/gestures/gesture';

@Directive({
  selector: '[longPress]'
})
export class LongPressDirective implements OnInit, OnDestroy {
  el: HTMLElement;
  pressGesture: Gesture;

  @Output()
  longPress: EventEmitter<any> = new EventEmitter();

  constructor(el: ElementRef) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.pressGesture = new Gesture(this.el);
    this.pressGesture.listen();
    this.pressGesture.on('press', e => {
      this.longPress.emit(e);
    })
  }

  ngOnDestroy() {
    this.pressGesture.destroy();
  }
}
