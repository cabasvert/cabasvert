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

import 'jasmine'

import { dayStringToISODay } from './data'
import { Season } from './model'

describe('Season', () => {

  let season

  beforeAll(() => {
    season = new Season({
      _id: 'season:2018W',
      _rev: '',
      sver: 'v1',
      type: 'season',
      name: 'Hiver 2018',
      weekCount: 24,
      distributionDay: 'tuesday',
      startWeek: [2018, 40],
      endWeek: [2019, 13],
      ignoredWeeks: [
        [2018, 52],
        [2019, 1],
      ],
    })
  })

  it('should have valid id and name', async () => {
    expect(season.id).toEqual('season:2018W')
    expect(season.name).toEqual('Hiver 2018')
  })

  it('should have valid season week count', async () => {
    expect(season.seasonWeeks().length).toEqual(season.weekCount)
  })

  it('should respect start and end week', async () => {
    expect(season.seasonWeekByNumber(1).distributionDate.getISOWeek()).toEqual([2018, 40])
    expect(season.seasonWeekByNumber(season.weekCount).distributionDate.getISOWeek()).toEqual([2019, 13])
  })

  it('should respect ignored weeks', async () => {
    expect(season.calendarToSeasonWeek([2018, 52])).toBeUndefined()
    expect(season.calendarToSeasonWeek([2019, 1])).toBeUndefined()
  })

  it('should respect distribution day', async () => {
    let isoDay = dayStringToISODay[season.distributionDay]
    season.seasonWeeks().forEach(w => expect(w.distributionDate.getISODay()).toEqual(isoDay))
  })

  it('should start 6 days before first distribution', async () => {
    expect(season.startDate).toEqual(new Date(2018, 8, 26))
  })

  it('should end 1 day after last distribution', async () => {
    expect(season.endDate).toEqual(new Date(2019, 2, 27))
  })

  it('should test containing dates', async () => {
    expect(season.contains(new Date(2019, 0, 1))).toBeTruthy()
    expect(season.contains(new Date(2018, 6, 14))).toBeFalsy()
  })

  it('should correctly find distributions by date', async () => {
    expect(season.seasonWeek(new Date(2018, 11, 25)).seasonWeek).toEqual(13)
    expect(season.seasonWeek(new Date(2019, 0, 2)).seasonWeek).toEqual(13)
    expect(season.seasonWeek(new Date(2019, 3, 1))).toBeUndefined()
  })

  it('should have week mapped', async () => {
    for (let number = 1; number <= season.weekCount; number++) {
      let week = season.seasonWeekByNumber(number)
      expect(week).toBeDefined()
      expect(week.seasonWeek).toEqual(number)
      expect(season.calendarToSeasonWeek(week.calendarWeek)).toEqual(week)
    }
  })

  it('should have alternative odd and even weeks', async () => {
    let otherWeek = false
    season.seasonWeeks().forEach(w => {
      expect(w.otherWeek).toEqual(otherWeek)
      otherWeek = !otherWeek
    })
  })

  it('should be correctly ordered', async () => {
    for (let number = 1; number <= season.weekCount; number++) {
      let week = season.seasonWeekByNumber(number)
      expect(week.previousWeek).toEqual(season.seasonWeekByNumber(number - 1))
      expect(week.nextWeek).toEqual(season.seasonWeekByNumber(number + 1))
    }
  })
})
