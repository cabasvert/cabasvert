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

import { objectAssignNoNulls } from './objects'

describe('objectAssignNoNulls', () => {

  it('should copy non-null properties', () => {
    const source = { a: 1, b: 2 }
    const result = objectAssignNoNulls({}, source)

    for (let key of Object.keys(source)) {
      expect(result[key]).toEqual(source[key])
    }
  })

  it('should not copy null properties', () => {
    const source = { a: null, b: null }
    const result = objectAssignNoNulls({}, source)
    expect(Object.keys(result)).toEqual([])
  })

  it('should erase null properties', () => {
    const source1 = { a: 1, b: 2 }
    const source2 = { a: null, b: null }
    const result = objectAssignNoNulls({}, source1, source2)
    expect(Object.keys(result)).toEqual([])
  })

})
