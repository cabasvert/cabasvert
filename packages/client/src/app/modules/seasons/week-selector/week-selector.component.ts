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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { merge, Observable, Subject, Subscription } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { Season, SeasonWeek } from '../season.model';
import { SeasonService } from '../season.service';

interface WeekInfo {
  week: SeasonWeek;
  isFirstOfMonth: boolean;
}

@Component({
  selector: 'app-week-selector',
  templateUrl: './week-selector.component.html',
  styleUrls: ['./week-selector.component.scss'],
})
export class WeekSelectorComponent implements OnInit, OnDestroy {

  @Input() season$: Observable<Season>;
  @Input() week$: Observable<SeasonWeek>;
  @Input() nullAllowed = false;
  @Input() handler: (week: SeasonWeek) => void;

  weekGroups$: Observable<WeekInfo[][]>;
  currentWeek$: Observable<SeasonWeek>;

  weekChange$ = new Subject<SeasonWeek>();
  selectedWeek$: Observable<SeasonWeek>;

  private _subscription: Subscription;

  constructor(private seasonService: SeasonService) {
    this.currentWeek$ = this.seasonService.todaysSeasonWeek$;
  }

  ngOnInit() {
    this.weekGroups$ = this.season$.pipe(
      map(season => this.computeWeekGroups(season)),
      publishReplay(1),
      refCount(),
    );
    this.selectedWeek$ = merge(this.week$, this.weekChange$).pipe(
      publishReplay(1),
      refCount(),
    );

    if (this.handler) {
      this._subscription = this.weekChange$.subscribe(this.handler);
    }
  }

  ngOnDestroy(): void {
    if (this._subscription) this._subscription.unsubscribe();
  }

  private computeWeekGroups(season) {
    let weekGroups: WeekInfo[][] = [];
    let currentWeekGroup: WeekInfo[] = [];

    let previousWeek = null;
    season.seasonWeeks().forEach(week => {
      if (week.doubleDistribution) {
        weekGroups.push(currentWeekGroup);
        currentWeekGroup = [];

        weekGroups.push([week]);
      } else {
        currentWeekGroup.push({
          week,
          isFirstOfMonth: !previousWeek || this.notSameMonth(week, previousWeek),
        });
      }

      if (currentWeekGroup.length === 4) {
        weekGroups.push(currentWeekGroup);
        currentWeekGroup = [];
      }

      previousWeek = week;
    });
    return weekGroups;
  }

  private notSameMonth(week, previousWeek: any) {
    return week.distributionDate.getMonth() !== previousWeek.distributionDate.getMonth();
  }

  isSameWeek(w1: SeasonWeek, w2: SeasonWeek) {
    return w1 && w2 && w1.season.id === w2.season.id && w1.seasonWeek === w2.seasonWeek;
  }
}
