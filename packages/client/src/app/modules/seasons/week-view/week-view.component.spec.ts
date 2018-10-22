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

import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { SeasonService } from '../season.service'

import { WeekViewComponent } from './week-view.component'

describe('WeekViewComponent', () => {
  let seasonService

  beforeEach(async(() => {
    seasonService = {
      seasonById$: jest.fn(),
    }

    TestBed.configureTestingModule({
        declarations: [WeekViewComponent],
        providers: [
          { provide: SeasonService, useValue: seasonService },
        ],
      })
      .compileComponents()
  }))

  let component: WeekViewComponent
  let fixture: ComponentFixture<WeekViewComponent>

  beforeEach(() => {
    fixture = TestBed.createComponent(WeekViewComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display the week', () => {
    let seasonId = 'season:2018S'
    let weekNumber = 7

    let season = {
      seasonWeekByNumber: jest.fn(),
    }
    seasonService.seasonById$.mockReturnValue(of(season))

    let week = { distributionDate: new Date(2018, 3, 1), seasonWeek: 7 }
    season.seasonWeekByNumber.mockReturnValue(week)

    component.seasonId = seasonId
    component.weekNumber = weekNumber

    component.ngOnChanges()
    fixture.detectChanges()

    expect(seasonService.seasonById$).toBeCalledWith(seasonId)
    expect(season.seasonWeekByNumber).toBeCalledWith(weekNumber)

    expect(season.seasonWeekByNumber).toHaveBeenCalled()

    let content = fixture.nativeElement.textContent
    expect(content).toContain('4/1/18 (7)')
  })
})
