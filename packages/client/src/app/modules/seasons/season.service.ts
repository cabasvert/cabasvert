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

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { distinctUntilChanged, map, publishReplay, refCount, switchMap } from 'rxjs/operators';
import { DatabaseService } from '../../toolkit/providers/database-service';
import { observeInsideAngular } from '../../utils/observables';
import { Season, SeasonWeek } from './season.model';

@Injectable()
export class SeasonService implements OnDestroy {

  private static readonly today$: Observable<Date> =
    timer(0, 60 * 1000).pipe(
      map(() => Date.today()),
      distinctUntilChanged((d1, d2) => d1.getDate() === d2.getDate()),
      publishReplay(1),
      refCount(),
    );

  private _seasonMapper = doc => new Season(this, doc);
  private _seasonIndexer = season => season.id;

  public readonly allSeasons$: Observable<Season[]>;
  public readonly allSeasonsIndexed$: Observable<Map<string, Season>>;

  public readonly latestSeason$: Observable<Season>;

  // FIXME Rename to currentSeason$ and currentSeasonWeek$
  public readonly todaysSeason$: Observable<Season>;
  public readonly todaysSeasonWeek$: Observable<SeasonWeek>;

  private _subscription = new Subscription();

  constructor(private mainDatabase: DatabaseService,
              private ngZone: NgZone) {

    this.createIndexes();

    // All seasons
    let query = {
      selector: {
        type: 'season',
      },
      use_index: 'type',
    };

    this.allSeasons$ =
      this.mainDatabase.findAll$(query, this._seasonMapper, this._seasonIndexer);

    this.allSeasonsIndexed$ =
      this.mainDatabase.findAllIndexed$(query, this._seasonMapper, this._seasonIndexer);

    this.latestSeason$ = this.latestSeasons$(1).pipe(map(ss => ss[0]));

    this.todaysSeason$ = SeasonService.today$.pipe(
      switchMap(today => this.seasonForDate$(today)),
      observeInsideAngular(this.ngZone),
      publishReplay(1),
      refCount(),
    );

    this.todaysSeasonWeek$ = SeasonService.today$.pipe(
      switchMap(today => this.seasonWeekForDate$(today)),
      observeInsideAngular(this.ngZone),
      publishReplay(1),
      refCount(),
    );

    this._subscription.add(this.todaysSeasonWeek$.subscribe());
    this._subscription.add(this.allSeasons$.subscribe());
    this._subscription.add(this.allSeasonsIndexed$.subscribe());
  }

  createIndexes() {
    this._subscription.add(
      this.mainDatabase.createIndex({ index: { fields: ['type'], ddoc: 'type' } }),
    );
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  latestSeasons$(count: number = -1): Observable<Season[]> {
    return this.allSeasons$.pipe(
      map(ss => ss.sort(this._byDescendingSeasonId)),
      map(ss => count === -1 ? ss : ss.slice(0, count)),
    );
  }

  private _bySeasonId = (s1, s2) => s1.id.localeCompare(s2.id);
  private _byDescendingSeasonId = (s1, s2) => -this._bySeasonId(s1, s2);

  seasonForDate$(date: Date = new Date()): Observable<Season> {
    return this.allSeasons$.pipe(map(ss => ss.find(s => s.contains(date))));
  }

  seasonWeekForDate$(date: Date = new Date()): Observable<SeasonWeek> {
    return this.seasonForDate$(date).pipe(map(s => !!s ? s.seasonWeek(date) : null));
  }

  seasonsForPeriod$(from: Date, to: Date): Observable<Season[]> {
    return this.allSeasons$.pipe(
      map(ss => ss.filter(s =>
        (s.startDate >= from && s.startDate < to)
        || (s.endDate >= from && s.endDate < to),
      )),
    );
  }

  seasonsForYear$(year: number): Observable<Season[]> {
    return this.seasonsForPeriod$(new Date(year, 0, 1), new Date(year + 1, 0, 1));
  }

  seasonById$(id: string): Observable<Season> {
    return this.allSeasonsIndexed$.pipe(map(ss => ss.get(id)));
  }

  seasonNameById$(id: string): Observable<string> {
    return this.seasonById$(id).pipe(map(s => s.name));
  }
}
