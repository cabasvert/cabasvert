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

import './dates'

describe('Date', () => {

  it('should correctly handle ISO day', async () => {
    expect(new Date(2018, 9, 20).getISODay()).toEqual(5)
    expect(new Date(2018, 9, 21).getISODay()).toEqual(6)
    expect(new Date(2018, 9, 20).setISODay(0)).toEqual(new Date(2018, 9, 15))
  })

  it('should correctly handle ISO week', async () => {
    expect(new Date(2018, 9, 20).getISOWeek()).toEqual([2018, 42])
    expect(new Date(2018, 9, 21).getISOWeek()).toEqual([2018, 42])
    expect(Date.fromISOWeek([2018, 42])).toEqual(new Date(2018, 9, 15))
    expect(Date.fromISOWeek([2021, 1])).toEqual(new Date(2021, 0, 4))
  })

  it('should correctly add days', async () => {
    expect(new Date(2018, 9, 20).addDays(7)).toEqual(new Date(2018, 9, 27))
    expect(new Date(2018, 9, 20).addDays(-5)).toEqual(new Date(2018, 9, 15))
  })

  it('should correctly subtract dates', async () => {
    expect(new Date(2018, 9, 20).subtract(new Date(2018, 9, 27))).toEqual(-7)
    expect(new Date(2018, 9, 20).subtract(new Date(2018, 9, 15))).toEqual(5)
  })

  it('should give valid today date', async () => {
    expect(Date.today().toLocaleTimeString('fr')).toEqual('00:00:00')
  })
})
