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

import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { distinct, map, publishReplay, refCount, switchMap, take } from 'rxjs/operators';
import { DatabaseService } from '../../toolkit/providers/database-service';
import { Season, SeasonWeek } from './season.model';

@Injectable()
export class SeasonService {

  private static today() {
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private today$: Observable<Date> =
    timer(0, 60 * 1000).pipe(
      map(_ => SeasonService.today()),
      distinct(d => d.getDate()),
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
      publishReplay(1),
      refCount(),
    );

  private _seasons$: Observable<Season[]>;
  private _seasonsIndexed$: Observable<{ [id: string]: Season }>;
  private _lastThreeSeasons$: Observable<Season[]>;

  constructor(private mainDatabase: DatabaseService) {

    // All seasons
    this._seasons$ = this.mainDatabase
      .withIndex$({
        index: {
          fields: ['type'],
        },
      })
      .pipe(
        switchMap(db => db.findAll$({
          selector: {
            type: 'season',
          },
        })),
        map((ss: any[]) => ss.map(s => new Season(this, s))),
        publishReplay(1),
        refCount(),
      );

    // TODO Make more optimal by using changes directly and not mapping the result of findAll
    this._seasonsIndexed$ = this.seasons$.pipe(
      map(
        ss => ss.reduce(
          (acc, s) => {
            acc[s.id] = s;
            return acc;
          },
          {},
        ),
      ),
      publishReplay(1),
      refCount(),
    );

    // Last three seasons
    this._lastThreeSeasons$ = this._lastSeasons$(3).pipe(
      publishReplay(1),
      refCount(),
    );
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
      switchMap(db =>
        db.findAll$(query).pipe(
          take(1),
          map((docs: any[]) => docs.map(d => d ? new Season(this, d) : null)),
        ),
      ),
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
      switchMap(db => db.findOne$(query)),
      map(doc => doc ? new Season(this, doc) : null),
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

  get seasonsIndexed$(): Observable<{ [id: string]: Season }> {
    return this._seasonsIndexed$;
  }

  seasonById$(id: string): Observable<Season> {
    return this.seasonsIndexed$.pipe(map(ss => ss[id]));
  }

  seasonNameById$(id: string): Observable<string> {
    return this.seasonById$(id).pipe(map(s => s.name));
  }

  // FIXME This is a hack to have distribution weeks start 5 days before the distribution day
  private static deltaDate(date: Date) {
    return date.addDays(4);
  }
}
