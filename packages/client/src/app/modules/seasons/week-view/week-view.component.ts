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

import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SeasonWeek } from '../season.model';
import { SeasonService } from '../season.service';

@Component({
  selector: 'app-week-view',
  templateUrl: './week-view.component.html',
  styleUrls: ['./week-view.component.scss'],
})
export class WeekViewComponent implements OnInit {

  @Input('seasonId') seasonId: string;
  @Input('weekNumber') weekNumber: number;

  seasonWeek$: Observable<SeasonWeek>;

  constructor(private seasonService: SeasonService) {
  }

  ngOnInit() {
    this.seasonWeek$ = this.seasonService.seasonById$(this.seasonId).pipe(
      map(season => season.seasonWeekByNumber(this.weekNumber)),
    );
  }
}
