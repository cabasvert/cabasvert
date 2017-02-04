import { Observable } from "rxjs/Observable"
import { of } from "rxjs/observable/of"
import { map } from "rxjs/operators"

import { SeasonService } from "./season.service"

export class Season {

  id: string
  name: string
  startDate: Date
  endDate: Date
  weekCount: number

  private _calendarToSeasonWeeks: Map<string, SeasonWeek> = new Map()
  private _seasonWeeks: Map<number, SeasonWeek> = new Map()

  constructor(private seasons: SeasonService, public seasonData: any) {
    this.id = seasonData._id
    this.name = seasonData.name
    this.startDate = new Date(seasonData.startDate)
    this.weekCount = seasonData.weekCount

    let ignoredWeeks = this.seasonData.ignoredWeeks || []
    let doubleWeeks = this.seasonData.doubleWeeks || []

    var date = this.startDate
    var calendarWeek = date.getWeek()
    var otherWeek = false
    for (var seasonWeek = 1; seasonWeek <= seasonData.weekCount;) {
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
      calendarWeek = date.getWeek()
    }
    this.endDate = new Date(seasonData.endDate)
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
    var weeks = []
    for (let weekNumber = 1; weekNumber <= this.weekCount; weekNumber++) {
      let seasonWeek = this.seasonWeekByNumber(weekNumber)
      weeks.push(seasonWeek)
    }
    return weeks
  }

  seasonWeek(date: Date): SeasonWeek | null {
    while (this.contains(date)) {
      let seasonWeek = this.calendarToSeasonWeek(date.getWeek())
      if (seasonWeek != null) return seasonWeek
      date = date.addDays(7)
    }
    return null
  }

  previousSeason$(): Observable<Season | null> {
    return this.seasons.seasonForDate$(this.startDate.addDays(-7))
  }

  nextSeason$(): Observable<Season | null> {
    return this.seasons.seasonForDate$(this.endDate)
  }
}

export class SeasonWeek {

  calendarWeek: [number, number]
  seasonWeek: number
  distributionDate: Date = new Date()
  doubleDistribution: boolean
  otherWeek: boolean

  constructor(public season: Season,
              calendarWeek: [number, number], seasonWeek: number, date: Date,
              double: boolean, otherWeek: boolean) {
    this.calendarWeek = calendarWeek
    this.seasonWeek = seasonWeek
    this.distributionDate = date
    this.doubleDistribution = double
    this.otherWeek = otherWeek
  }

  public previousWeek$(): Observable<SeasonWeek | null> {
    if (this.seasonWeek > 1)
      return of(this.season.seasonWeekByNumber(this.seasonWeek - 1))
    else {
      return this.season.previousSeason$().pipe(
        map(s => s ? s.seasonWeekByNumber(s.weekCount) : null),
      )
    }
  }

  public nextWeek$(): Observable<SeasonWeek | null> {
    if (this.seasonWeek < this.season.weekCount)
      return of(this.season.seasonWeekByNumber(this.seasonWeek + 1))
    else {
      return this.season.nextSeason$().pipe(
        map(s => s ? s.seasonWeekByNumber(1) : null),
      )
    }
  }
}
