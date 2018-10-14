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

import { ReadonlyTuple } from '../../type-utils'
import { VersionedDocument } from '../../document'

export const VERSION = 'v1'

export type SeasonDocument = SeasonData & VersionedDocument<'v1'>

/**
 * A season of distributions.
 */
export interface SeasonData {
  readonly name: string

  readonly distributionDay: DayString

  readonly weekCount: number

  readonly startWeek: CalendarWeek
  readonly endWeek: CalendarWeek

  readonly ignoredWeeks: ReadonlyArray<CalendarWeek>
  readonly doubleWeeks: ReadonlyArray<CalendarWeek>
}

/**
 * A calendar week is a pair of numbers consisting of a year and an ISO-8601 week number.
 */
// FIXME Make immutable
export type CalendarWeek = [number, number]

/**
 * A day string denotes a day of the week in English and lowercase.
 */
export type DayString =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/**
 * Maps day string to ISO-8601 day number values. The ISO-8601 week starts on monday.
 */
export const dayStringToISODay: Readonly<{ [d in DayString]: number }> = {
  'monday': 0,
  'tuesday': 1,
  'wednesday': 2,
  'thursday': 3,
  'friday': 4,
  'saturday': 5,
  'sunday': 6,
}
