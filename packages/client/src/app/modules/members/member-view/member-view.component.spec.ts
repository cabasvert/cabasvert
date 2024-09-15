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

import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Member } from '../member.model'
import { MemberView } from './member-view'
import { setupTestBed } from '../../../utils/testbed'

describe('MemberViewComponent', () => {

  setupTestBed({
    declarations: [MemberView],
  })

  let component: MemberView
  let fixture: ComponentFixture<MemberView>

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberView)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display the member with 1 person', () => {
    let member: Member = {
      _id: 'test-member',
      persons: [
        {
          firstname: 'Didier',
          lastname: 'Villevalois',
        }
      ],
    }

    component.member = member

    fixture.detectChanges()

    expect(fixture).toMatchSnapshot()
  })

  it('should display the member with 3 person', () => {
    let member: Member = {
      _id: 'test-member',
      persons: [
        {
          firstname: 'John',
          lastname: 'Smith',
        },
        {
          firstname: 'Jane',
          lastname: 'Doe',
        },
        {
          firstname: 'Lee',
          lastname: 'Smith',
        }
      ],
    }

    component.member = member

    fixture.detectChanges()

    expect(fixture).toMatchSnapshot()
  })
})
