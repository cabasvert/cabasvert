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

import { NgZone } from "@angular/core"
import { MonoTypeOperatorFunction, OperatorFunction } from "rxjs/interfaces"
import { Observable } from "rxjs/Observable"
import { empty } from "rxjs/observable/empty"
import { of } from "rxjs/observable/of"
import { Observer } from "rxjs/Observer"
import {
  catchError,
  filter,
  ignoreElements,
  map,
  mapTo,
  observeOn,
  pairwise,
  tap,
} from "rxjs/operators"
import { pipe } from "rxjs/util/pipe"
import { Scheduler } from "rxjs/Scheduler"
import { async } from "rxjs/scheduler/async"
import { Subscription } from "rxjs/Subscription"

export function previous<T>(): MonoTypeOperatorFunction<T> {
  return pipe(pairwise(), map(([previous, _]) => previous))
}

export function filterNotNull<T>(): MonoTypeOperatorFunction<T> {
  return filter(element => !!element)
}

export function errors<T>(): OperatorFunction<T, string> {
  return pipe(mapTo(null), ignoreElements(), catchError(e => of(e.message + '\n' + e.stack)))
}

export function ignoreErrors<T>(): MonoTypeOperatorFunction<T> {
  return catchError(_ => empty<T>())
}

export function debug<T>(prefix: string, f: (T) => any = v => v): MonoTypeOperatorFunction<T> {
  return tap(debugObservable<T>(prefix, f))
}

export function debugObservable<T>(prefix: string, f: (T) => any): Observer<T> {
  return new DebugObserver(prefix, f)
}

class DebugObserver<T> implements Observer<T> {

  constructor(private prefix: string,
              private f: (T) => any = v => v) {
  }

  next: (value: T) => void = v => console.debug(`${this.prefix} - Next value:`, this.f(v))
  error: (err: any) => void = e => console.error(`${this.prefix} - Error:`, e)
  complete: () => void = () => console.debug(`${this.prefix} - Complete!`)
}

export function observeInsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return observeOn(enterZone(zone))
}

export function observeOutsideAngular<T>(zone: NgZone): MonoTypeOperatorFunction<T> {
  return observeOn(leaveZone(zone))
}

export function leaveZone(zone: NgZone, scheduler: Scheduler = async): Scheduler {
  return new LeaveZoneScheduler(zone, scheduler) as any
}

export function enterZone(zone: NgZone, scheduler: Scheduler = async): Scheduler {
  return new EnterZoneScheduler(zone, scheduler) as any
}

class LeaveZoneScheduler {
  constructor(private zone: NgZone, private scheduler: Scheduler) {
  }

  schedule(...args: any[]): Subscription {
    return this.zone.runOutsideAngular(() =>
      this.scheduler.schedule.apply(this.scheduler, args),
    )
  }
}

class EnterZoneScheduler {
  constructor(private zone: NgZone, private scheduler: Scheduler) {
  }

  schedule(...args: any[]): Subscription {
    return this.zone.run(() =>
      this.scheduler.schedule.apply(this.scheduler, args),
    )
  }
}

export const zoneName: () => string = typeof Zone !== 'undefined' && Zone.current
  ? () => Zone.current.name
  : () => 'no zone'
