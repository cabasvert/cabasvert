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

import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { SeasonService } from './season.service';

interface SeasonData {
  _id: string;
  name: string;
  startWeek: CalendarWeek;
  endWeek: CalendarWeek;
  distributionDay: DayString;
  weekCount: number;
  ignoredWeeks: CalendarWeek[];
  doubleWeeks: CalendarWeek[];
}

type CalendarWeek = [number, number];

type DayString =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const dayStringToISODay = {
  'monday': 0,
  'tuesday': 1,
  'wednesday': 2,
  'thursday': 3,
  'friday': 4,
  'saturday': 5,
  'sunday': 6,
};

export class Season {

  private _calendarToSeasonWeeks: Map<string, SeasonWeek> = new Map();
  private _seasonWeeks: Map<number, SeasonWeek> = new Map();

  constructor(private seasons: SeasonService, public seasonData: SeasonData) {
    try {
      this.computeWeeks();
    } catch (error) {
      console.log(error);
      console.log(this.seasonData);
      this._seasonWeeks.forEach(
        (w, i) => console.log(`${i} - ${w.calendarWeek}, ${w.distributionDate}`),
      );
    }
  }

  private computeWeeks() {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay];
    let date = Date.fromISOWeek(this.seasonData.startWeek).setISODay(distributionDay);

    let weekCount = this.seasonData.weekCount;
    let ignoredWeeks = this.seasonData.ignoredWeeks || [];
    let doubleWeeks = this.seasonData.doubleWeeks || [];

    let calendarWeek;
    let otherWeek = false;
    for (let seasonWeek = 1; seasonWeek <= weekCount;) {
      calendarWeek = date.getISOWeek();

      let ignored = ignoredWeeks.some((w) => calendarWeek.toString() === w.toString());
      let double = doubleWeeks.some((w) => calendarWeek.toString() === w.toString());

      if (!ignored) {
        let week = new SeasonWeek(this, calendarWeek, seasonWeek, date, double, otherWeek);
        this._calendarToSeasonWeeks.set(calendarWeek.toString(), week);
        this._seasonWeeks.set(seasonWeek, week);
        seasonWeek++;
        if (!double) otherWeek = !otherWeek;
      }

      date = date.addDays(7);
    }

    if (calendarWeek.toString() !== this.seasonData.endWeek.toString())
      throw new Error('Error computing season weeks');
  }

  get id() {
    return this.seasonData._id;
  }

  get name() {
    return this.seasonData.name;
  }

  get weekCount() {
    return this.seasonData.weekCount;
  }

  get startDate() {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay];
    return Date.fromISOWeek(this.seasonData.startWeek).setISODay(distributionDay).addDays(-6);
  }

  get endDate() {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay];
    return Date.fromISOWeek(this.seasonData.endWeek).setISODay(distributionDay).addDays(1);
  }

  calendarToSeasonWeek(calendarWeek: [number, number]): SeasonWeek {
    return this._calendarToSeasonWeeks.get(calendarWeek.toString());
  }

  seasonWeekByNumber(seasonWeek: number): SeasonWeek {
    return this._seasonWeeks.get(seasonWeek);
  }

  contains(date: Date) {
    return this.startDate <= date && date < this.endDate;
  }

  seasonWeeks(): SeasonWeek[] {
    let weeks = [];
    for (let weekNumber = 1; weekNumber <= this.weekCount; weekNumber++) {
      let seasonWeek = this.seasonWeekByNumber(weekNumber);
      weeks.push(seasonWeek);
    }
    return weeks;
  }

  seasonWeek(date: Date): SeasonWeek | null {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay];
    let thisDay = date.getISODay();
    if (distributionDay < thisDay) date = date.addDays(7 - thisDay + distributionDay);

    while (this.contains(date)) {
      let seasonWeek = this.calendarToSeasonWeek(date.getISOWeek());
      if (seasonWeek != null) return seasonWeek;
      date = date.addDays(7);
    }
    return null;
  }

  previousSeason$(): Observable<Season | null> {
    return this.seasons.seasonForDate$(this.startDate.addDays(-1));
  }

  nextSeason$(): Observable<Season | null> {
    return this.seasons.seasonForDate$(this.endDate.addDays(+1));
  }
}

export class SeasonWeek {

  calendarWeek: [number, number];
  seasonWeek: number;
  distributionDate: Date = new Date();
  doubleDistribution: boolean;
  otherWeek: boolean;

  constructor(public season: Season,
              calendarWeek: [number, number], seasonWeek: number, date: Date,
              double: boolean, otherWeek: boolean) {
    this.calendarWeek = calendarWeek;
    this.seasonWeek = seasonWeek;
    this.distributionDate = date;
    this.doubleDistribution = double;
    this.otherWeek = otherWeek;
  }

  public previousWeek$(): Observable<SeasonWeek | null> {
    if (this.seasonWeek > 1)
      return of(this.season.seasonWeekByNumber(this.seasonWeek - 1));
    else {
      return this.season.previousSeason$().pipe(
        map(s => s ? s.seasonWeekByNumber(s.weekCount) : null),
      );
    }
  }

  public nextWeek$(): Observable<SeasonWeek | null> {
    if (this.seasonWeek < this.season.weekCount)
      return of(this.season.seasonWeekByNumber(this.seasonWeek + 1));
    else {
      return this.season.nextSeason$().pipe(
        map(s => s ? s.seasonWeekByNumber(1) : null),
      );
    }
  }
}
