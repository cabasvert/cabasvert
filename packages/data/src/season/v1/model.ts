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

import '../../utils/dates'
import { dayStringToISODay, SeasonDocument } from './data'

export class Season {

  private _calendarToSeasonWeeks: Map<string, SeasonWeek> = new Map()
  private _seasonWeeks: Map<number, SeasonWeek> = new Map()

  constructor(private seasonData: SeasonDocument) {
    this.computeWeeks()
  }

  private computeWeeks() {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay]
    let date = Date.fromISOWeek(this.seasonData.startWeek).setISODay(distributionDay)

    let weekCount = this.seasonData.weekCount
    let ignoredWeeks = this.seasonData.ignoredWeeks || []
    let doubleWeeks = this.seasonData.doubleWeeks || []

    let calendarWeek
    let otherWeek = false
    for (let seasonWeek = 1; seasonWeek <= weekCount;) {
      calendarWeek = date.getISOWeek()

      let ignored = ignoredWeeks.some((w) => calendarWeek.toString() === w.toString())
      let double = doubleWeeks.some((w) => calendarWeek.toString() === w.toString())

      if (!ignored) {
        let week = new SeasonWeek(this, calendarWeek, seasonWeek, date, double, otherWeek)
        this._calendarToSeasonWeeks.set(calendarWeek.toString(), week)
        this._seasonWeeks.set(seasonWeek, week)
        seasonWeek++
        if (!double) otherWeek = !otherWeek
      }

      date = date.addDays(7)
    }
  }

  get id() {
    return this.seasonData._id
  }

  get name() {
    return this.seasonData.name
  }

  get distributionDay() {
    return this.seasonData.distributionDay
  }

  get weekCount() {
    return this.seasonData.weekCount
  }

  get startDate() {
    return this.seasonWeekByNumber(1).startDate
  }

  get endDate() {
    return this.seasonWeekByNumber(this.weekCount).endDate
  }

  calendarToSeasonWeek(calendarWeek: [number, number]): SeasonWeek {
    return this._calendarToSeasonWeeks.get(calendarWeek.toString())
  }

  seasonWeekByNumber(seasonWeek: number): SeasonWeek {
    return this._seasonWeeks.get(seasonWeek)
  }

  contains(date: Date) {
    return this.startDate <= date && date < this.endDate
  }

  seasonWeeks(): SeasonWeek[] {
    let weeks = []
    for (let weekNumber = 1; weekNumber <= this.weekCount; weekNumber++) {
      let seasonWeek = this.seasonWeekByNumber(weekNumber)
      weeks.push(seasonWeek)
    }
    return weeks
  }

  seasonWeek(date: Date): SeasonWeek | undefined {
    let distributionDay = dayStringToISODay[this.seasonData.distributionDay]
    let thisDay = date.getISODay()
    if (distributionDay < thisDay) date = date.addDays(7 - thisDay + distributionDay)

    while (this.contains(date)) {
      let seasonWeek = this.calendarToSeasonWeek(date.getISOWeek())
      if (seasonWeek != null) return seasonWeek
      date = date.addDays(7)
    }
    return undefined
  }
}

export class SeasonWeek {

  constructor(public season: Season,
              public readonly calendarWeek: [number, number],
              public readonly seasonWeek: number,
              public readonly distributionDate: Date,
              public readonly doubleDistribution: boolean,
              public readonly otherWeek: boolean) {
  }

  get startDate() {
    return this.distributionDate.addDays(-6)
  }

  get endDate() {
    return this.distributionDate.addDays(+1)
  }

  get previousWeek(): SeasonWeek | undefined {
    return this.seasonWeek > 1 ?
      this.season.seasonWeekByNumber(this.seasonWeek - 1) :
      undefined
  }

  get nextWeek(): SeasonWeek | undefined {
    return this.seasonWeek < this.season.weekCount ?
      this.season.seasonWeekByNumber(this.seasonWeek + 1) :
      undefined
  }
}
