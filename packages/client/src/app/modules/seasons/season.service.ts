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

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount, switchMap } from 'rxjs/operators';
import { DatabaseService } from '../../toolkit/providers/database-service';
import { filterNotNull } from '../../utils/observables';
import { Season, SeasonWeek } from './season.model';

@Injectable()
export class SeasonService implements OnDestroy {

  private static today() {
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private today$: Observable<Date> =
    timer(0, 60 * 1000).pipe(
      map(() => SeasonService.today()),
      distinctUntilChanged((d1, d2) => d1.getDate() === d2.getDate()),
      publishReplay(1),
      refCount(),
    );

  private _todaysSeason$: Observable<Season> =
    this.today$.pipe(
      switchMap(today => this.seasonForDate$(today)),
      publishReplay(1),
      refCount(),
    );

  private _todaysSeasonWeek$: Observable<SeasonWeek> =
    this.today$.pipe(
      switchMap(today => this.seasonWeekForDate$(today)),
      filterNotNull(),
      publishReplay(1),
      refCount(),
    );

  private readonly _seasons$: Observable<Season[]>;
  private readonly _seasonsIndexed$: Observable<Map<string, Season>>;
  private readonly _lastThreeSeasons$: Observable<Season[]>;

  private _subscription = new Subscription();

  constructor(private mainDatabase: DatabaseService) {

    // All seasons
    let { query, db$ } = this.seasonsQuery();

    this._seasons$ = db$.pipe(
      switchMap(db => db.findAll$(query, doc => new Season(this, doc), season => season.id)),
      publishReplay(1),
      refCount(),
    );

    this._seasonsIndexed$ = db$.pipe(
      switchMap(db => db.findAllIndexed$(query, doc => new Season(this, doc), season => season.id)),
      publishReplay(1),
      refCount(),
    );

    // Last three seasons
    this._lastThreeSeasons$ = this._lastSeasons$(3);

    this._subscription.add(this._seasons$.subscribe());
    this._subscription.add(this._seasonsIndexed$.subscribe());
    this._subscription.add(this._lastThreeSeasons$.subscribe());
  }

  private seasonsQuery() {
    let query = {
      selector: {
        type: 'season',
      },
    };

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type'],
      },
    });

    return { query, db$ };
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  lastSeasons$(count: number = 1): Observable<Season[]> {
    if (count <= 3) {
      return this._lastThreeSeasons$.pipe(
        map(ss => ss.slice(0, count)),
      );
    } else {
      return this._lastSeasons$(count);
    }
  }

  private _lastSeasons$(count: number = 1): Observable<Season[]> {
    let query = {
      selector: {
        type: 'season',
      },
      sort: [{
        type: 'desc',
        _id: 'desc',
      }],
      limit: count,
    };

    let db$ = this.mainDatabase.withIndex$({
        index: {
          fields: ['type', '_id'],
        },
      },
    );

    return db$.pipe(
      switchMap(db => db.findAll$(query, doc => new Season(this, doc), season => season.id)),
      publishReplay(1),
      refCount(),
    );
  }

  seasonForDate$(date: Date = new Date()): Observable<Season> {
    let query = {
      selector: {
        type: 'season',
        startDate: { $lte: SeasonService.deltaDate(date).toISOString() },
        endDate: { $gt: SeasonService.deltaDate(date).toISOString() },
      },
    };

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type', 'startDate', 'endDate'],
      },
    });

    return db$.pipe(
      switchMap(db => db.findOne$(query, s => new Season(this, s))),
      publishReplay(1),
      refCount(),
    );
  }

  seasonWeekForDate$(date: Date = new Date()): Observable<SeasonWeek> {
    return this.seasonForDate$(date).pipe(
      map(s => s ? s.seasonWeek(SeasonService.deltaDate(date)) : null),
    );
  }

  get todaysSeason$(): Observable<Season> {
    return this._todaysSeason$;
  }

  get todaysSeasonWeek$() {
    return this._todaysSeasonWeek$;
  }

  get seasons$(): Observable<Season[]> {
    return this._seasons$;
  }

  get seasonsIndexed$(): Observable<Map<string, Season>> {
    return this._seasonsIndexed$;
  }

  seasonById$(id: string): Observable<Season> {
    return this.seasonsIndexed$.pipe(map(ss => ss.get(id)));
  }

  seasonNameById$(id: string): Observable<string> {
    return this.seasonById$(id).pipe(map(s => s.name));
  }

  // FIXME This is a hack to have distribution weeks start 5 days before the distribution day
  private static deltaDate(date: Date) {
    return date.addDays(4);
  }
}
