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


import { isNullOrUndefined } from "util"
export function objectAssignNoNulls<T, U>(target: T, source: U): T & U
export function objectAssignNoNulls<T, U, V>(target: T, source1: U, source2: V): T & U & V
export function objectAssignNoNulls<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W
export function objectAssignNoNulls(target: any, ...sources: any[]): any {
  for (var source of sources) {
    for (var key in source) {
      let value = source[key]
      if (!isNullOrUndefined(value)) target[key] = value
      else delete target[key]
    }
  }
  return target
}
