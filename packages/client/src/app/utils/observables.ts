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

import { NgZone } from '@angular/core';
import {
  asyncScheduler,
  EMPTY,
  MonoTypeOperatorFunction,
  Observer,
  of,
  OperatorFunction,
  pipe,
  SchedulerLike,
  Subscription,
} from 'rxjs';
import {
  catchError,
  filter,
  ignoreElements,
  map,
  mapTo,
  observeOn,
  pairwise, subscribeOn,
  tap,
} from 'rxjs/operators';

export function previous<T>(): MonoTypeOperatorFunction<T> {
  return pipe(pairwise(), map(([p, _]) => p));
}

export function filterNotNull<T>(): MonoTypeOperatorFunction<T> {
  return filter(element => !!element);
}

export function errors<T>(): OperatorFunction<T, string> {
  return pipe(mapTo(null), ignoreElements(), catchError(e => of(e.message + '\n' + e.stack)));
}

export function ignoreErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError(_ => EMPTY);
}

export function debugObservable<T>(prefix: string, f: (T) => any = v => v): MonoTypeOperatorFunction<T> {
  return tap(new DebugObserver<T>(prefix, f));
}

class DebugObserver<T> implements Observer<T> {

  constructor(private prefix: string,
              private f: (T) => any = v => v) {
  }

  next: (value: T) => void = v => console.log(`${this.prefix} [${zoneName()}] Next value:`, this.f(v));
  error: (err: any) => void = e => console.error(`${this.prefix} [${zoneName()}] Error:`, e);
  complete: () => void = () => console.log(`${this.prefix} [${zoneName()}] Complete!`);
}

export function subscribeOutsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return subscribeOn(leaveZone(zone));
}

export function observeInsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return observeOn(enterZone(zone));
}

export function observeOutsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return observeOn(leaveZone(zone));
}

export function leaveZone(zone: NgZone, scheduler: SchedulerLike = asyncScheduler): SchedulerLike {
  return new LeaveZoneScheduler(zone, scheduler) as any;
}

export function enterZone(zone: NgZone, scheduler: SchedulerLike = asyncScheduler): SchedulerLike {
  return new EnterZoneScheduler(zone, scheduler) as any;
}

class LeaveZoneScheduler implements SchedulerLike {
  static now: () => number;

  constructor(private zone: NgZone, private scheduler: SchedulerLike) {
  }

  now: () => number = LeaveZoneScheduler.now;

  schedule(...args: any[]): Subscription {
    return this.zone.runOutsideAngular(() =>
      this.scheduler.schedule.apply(this.scheduler, args),
    );
  }
}

class EnterZoneScheduler implements SchedulerLike {
  static now: () => number;

  constructor(private zone: NgZone, private scheduler: SchedulerLike) {
  }

  now: () => number = EnterZoneScheduler.now;

  schedule(...args: any[]): Subscription {
    return this.zone.run(() =>
      this.scheduler.schedule.apply(this.scheduler, args),
    );
  }
}

export const zoneName: () => string = typeof Zone !== 'undefined' && Zone.current
  ? () => Zone.current.name
  : () => 'no zone';
