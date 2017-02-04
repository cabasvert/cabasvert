import { Injectable } from '@angular/core'
import { Observable } from "rxjs/Observable"
import { timer } from "rxjs/observable/timer"
import { distinct, map, publishReplay, refCount, switchMap, take } from "rxjs/operators"
import { DatabaseService } from "../../toolkit/providers/database-service"
import { Season, SeasonWeek } from "./season.model"

@Injectable()
export class SeasonService {

  private static today() {
    let date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }

  private today$: Observable<Date> =
    timer(0, 60 * 1000).pipe(
      map(_ => SeasonService.today()),
      distinct(d => d.getDate()),
      publishReplay(1),
      refCount(),
    )

  private _todaysSeason$: Observable<Season> =
    this.today$.pipe(
      switchMap(today => this.seasonForDate$(today)),
      publishReplay(1),
      refCount(),
    )

  private _todaysSeasonWeek$: Observable<SeasonWeek> =
    this.today$.pipe(
      switchMap(today => this.seasonWeekForDate$(today)),
      publishReplay(1),
      refCount(),
    )

  constructor(private mainDatabase: DatabaseService) {
  }

  lastSeasons$(count: number = 1): Observable<Season[]> {
    let query = {
      selector: {
        type: 'season',
      },
      sort: [{
        _id: 'desc',
      }],
      limit: count,
    }

    let db$ = this.mainDatabase.withIndex$({
        index: {
          fields: ['type', '_id']
        }
      }
    )
    return db$.pipe(
      switchMap(db =>
        db.findAll$(query).pipe(
          take(1),
          map((docs: any[]) => docs.map(d => d ? new Season(this, d) : null)),
        ),
      ),
    )
  }

  seasonForDate$(date: Date = new Date()): Observable<Season> {
    let query = {
      selector: {
        type: 'season',
        startDate: { $lte: SeasonService.deltaDate(date).toISOString() },
        endDate: { $gt: SeasonService.deltaDate(date).toISOString() },
      }
    }

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type', 'startDate', 'endDate']
      }
    })
    return db$.pipe(
      switchMap(db => db.findOne$(query)),
      map(doc => doc ? new Season(this, doc) : null),
    )
  }

  seasonWeekForDate$(date: Date = new Date()): Observable<SeasonWeek> {
    return this.seasonForDate$(date).pipe(
      map(s => s ? s.seasonWeek(SeasonService.deltaDate(date)) : null)
    )
  }

  get todaysSeason$(): Observable<Season> {
    return this._todaysSeason$
  }

  get todaysSeasonWeek$() {
    return this._todaysSeasonWeek$
  }

  // FIXME This is a hack to have distribution weeks start 5 days before the distribution day
  private static deltaDate(date: Date) {
    return date.addDays(4)
  }
}
