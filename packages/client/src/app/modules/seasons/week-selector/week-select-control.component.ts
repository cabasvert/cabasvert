/**
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

import { Component, forwardRef, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Season } from '../season.model';
import { WeekSelectorComponent } from './week-selector.component';

@Component({
  selector: 'app-week-select',
  templateUrl: './week-select-control.component.html',
  styleUrls: ['./week-select-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WeekSelectControl),
      multi: true,
    },
  ],
})
export class WeekSelectControl implements ControlValueAccessor, OnInit, OnDestroy {

  week$ = new BehaviorSubject<number>(null);

  @Input() season$: Observable<Season>;

  @Input() set weekNumber(week: number) {
    this.week$.next(week);
  }

  get weekNumber() {
    return this.week$.getValue();
  }

  @Input() nullAllowed = false;

  @HostBinding('class.select-disabled')
  disabled: boolean;

  decrementDisabled$: Observable<boolean>;
  incrementDisabled$: Observable<boolean>;

  private _propagateChange: (value: any) => void;

  private _subscription: Subscription;

  constructor(private popoverCtrl: PopoverController) {
    this._subscription = this.week$.subscribe(week => {
      if (this._propagateChange) this._propagateChange(week);
    });
  }

  ngOnInit() {
    this.decrementDisabled$ = this.week$.pipe(
      map(week => this.nullAllowed ? !week : !week || week === 1),
    );

    this.incrementDisabled$ = combineLatest(this.week$, this.season$).pipe(
      map(([week, season]) => !!week && week === season.weekCount),
    );

    this.week$.next(this.weekNumber);
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe();
  }

  async showWeekSelector($event) {
    let popover = await this.popoverCtrl.create({
      event: $event,
      component: WeekSelectorComponent,
      componentProps: {
        season$: this.season$,
        week$: this.season$.pipe(
          map(season => season.seasonWeekByNumber(this.weekNumber)),
        ),
        nullAllowed: this.nullAllowed,
        handler: value => {
          this.weekNumber = value && value.seasonWeek;
          popover.dismiss();
        },
      },
      // FIXME Find a correct way to open the popover on the right
      cssClass: ['large-popover', 'right-popover'],
    });
    await popover.present();
  }

  decrement() {
    if (this.nullAllowed && this.weekNumber === 1) this.weekNumber = null;
    else this.weekNumber--;
  }

  increment() {
    if (!this.weekNumber) this.weekNumber = 1;
    else this.weekNumber++;
  }

  writeValue(obj: any): void {
    this.weekNumber = obj;
  }

  registerOnChange(fn: any): void {
    this._propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
