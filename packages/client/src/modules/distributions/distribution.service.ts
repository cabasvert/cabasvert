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

import { Injectable } from '@angular/core'
import { Observable } from "rxjs/Observable"
import { combineLatest } from "rxjs/observable/combineLatest"
import { map, publishReplay, refCount, switchMap } from "rxjs/operators"

import { DatabaseService } from "../../toolkit/providers/database-service"
import '../../utils/dates'

import { Contract, ContractKind, ContractSection } from "../contracts/contract.model"
import { ContractService } from "../contracts/contract.service"
import { Member } from "../members/member.model"
import { MemberService } from "../members/member.service"
import { SeasonWeek } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

import { Basket, BasketSection, BasketSectionTotals, Distribution } from "./distribution.model"

@Injectable()
export class DistributionService {

  private _todaysBaskets$: Observable<Basket[]> =
    this.seasons.todaysSeasonWeek$.pipe(
      switchMap(week => this.getBaskets$(week)),
      publishReplay(1),
      refCount(),
    )

  private _todaysTotals$: Observable<{ [kind: string]: BasketSectionTotals }> =
    this._todaysBaskets$.pipe(
      map(bs => DistributionService.totals(bs)),
      publishReplay(1),
      refCount(),
    )

  constructor(private mainDatabase: DatabaseService,
              private seasons: SeasonService,
              private members: MemberService,
              private contracts: ContractService) {
  }

  public static basketCount(contract: Contract, section: ContractSection, week: SeasonWeek) {
    let count = DistributionService.basketCountWithoutModifications(section, week)
    let seasonWeek = week.seasonWeek

    // Take contract amendments in account
    if (contract.amendments) {
      contract.amendments.forEach(a => {
        if (a.week == seasonWeek) {
          let delta = a.deltas[section.kind]
          if (delta) count += delta.count
        }
      })
    }

    // Take basket postponements in account
    if (contract.postponements) {
      contract.postponements.forEach(p => {
        if (p.week == seasonWeek) {
          let delta = p.deltas[section.kind]
          if (delta) count += delta.count
        } else if (p.rescheduledWeek == seasonWeek) {
          let delta = p.deltas[section.kind]
          if (delta) count -= delta.count
        }
      })
    }

    return count
  }

  private static basketCountWithoutModifications(section: ContractSection, week: SeasonWeek) {
    let weekNumber = week.seasonWeek
    let doubleDistribution = week.doubleDistribution

    if (section.firstWeek > weekNumber || (section.lastWeek && section.lastWeek < weekNumber))
      return 0

    let formula = section.formula

    if (doubleDistribution) {
      if (formula instanceof Array) return formula[0] + formula[1]
      else return formula * 2
    }

    let isMainWeek = section.firstWeek % 2 == (week.otherWeek ? 0 : 1)
    if (formula instanceof Array) return formula[isMainWeek ? 0 : 1]
    else {
      if (formula != parseInt('' + formula)) formula += (isMainWeek ? .5 : -.5)
      return Math.round(formula)
    }
  }

  getBaskets$(week: SeasonWeek): Observable<Basket[]> {
    let members$ = this.members.getMembers$()
    let membersIndexed$ = this.members.getMembersIndexed$()
    let contracts$: Observable<Contract[]> = this.contracts.getSeasonContracts$(week.season)

    let trialBaskets$: Observable<Member[]> = members$.pipe(
      map(ms =>
        ms.filter(m => MemberService.memberHasTrialBasketForWeek(m, week)),
      ),
      publishReplay(1),
      refCount(),
    )

    return combineLatest(membersIndexed$, contracts$, trialBaskets$,
      (ms, cs, tbs) => {

        let baskets = []

        cs.forEach(c => {
          if (c.type !== 'contract' && c.srev !== 'v1') return
          if (!c.sections) return

          let member = ms[c.member]

          let sections: { [kind: string]: BasketSection } = {}
          c.sections.forEach(s => {
            let { kind, formula, ..._ } = s
            if (!formula) return

            let count = DistributionService.basketCount(c, s, week)

            if (count == 0) return
            sections[kind] = { kind, count }
          })

          if (Object.keys(sections).length == 0) return
          baskets.push(new Basket(member, sections))
        })

        tbs.forEach(tb => {
          let trialBasket = MemberService.memberGetTrialBasketForWeek(tb, week)
          if (!trialBasket) return

          let sections: { [kind: string]: BasketSection } = {}
          trialBasket.sections.forEach(s => {
            let { kind, count, ..._ } = s

            if (count == 0) return
            sections[kind] = { kind, count }
          })

          if (Object.keys(sections).length == 0) return
          baskets.push(new Basket(tb, sections, true))
        })

        return baskets.sort((b1, b2) => DistributionService.memberCompare(b1.member, b2.member))
      },
    )
  }

  get todaysBaskets$(): Observable<Basket[]> {
    return this._todaysBaskets$
  }

  get todaysTotals$(): Observable<{ [kind: string]: BasketSectionTotals }> {
    return this._todaysTotals$
  }

  public static totals(baskets: Basket[] | null): { [kind: string]: BasketSectionTotals } {
    let allCounts: { [kind: string]: BasketSectionTotals } = {}

    function sectionCounts(kind: string): BasketSectionTotals {
      let counts = allCounts[kind]
      if (!counts) {
        counts = { kind, allBasketCount: 0, trialBasketCount: 0 }
        allCounts[kind] = counts
      }
      return counts
    }

    if (baskets) {
      baskets.forEach(b => {
        let contractCounted = false

        ContractKind.ALL.forEach(kind => {
          let section = b.sections[kind]
          if (!section) return

          let count = section.count

          if (count > 0) {
            contractCounted = true
            let counts = sectionCounts(kind)
            counts.allBasketCount += count
            if (b.isTrial) counts.trialBasketCount += count
          }
        })

        if (contractCounted) {
          let counts = sectionCounts('cumulative')
          counts.allBasketCount++
          if (b.isTrial) counts.trialBasketCount++
        }
      })
    }

    return allCounts
  }

  getDistribution$(week: SeasonWeek): Observable<Distribution> {
    let query = {
      selector: {
        type: 'distribution',
        season: week.season.id,
        week: week.seasonWeek,
      },
      limit: 1,
    }
    let defaultValue = () => Distribution.createDoc(week)

    let db$ = this.mainDatabase.withIndex$({
      index: {
        fields: ['type', 'season', 'week'],
      },
    })
    return db$.pipe(
      switchMap(db => db.findOne$(query, defaultValue)),
      map(doc => new Distribution(doc, week, this.mainDatabase)),
    )
  }

  private static memberCompare(member1, member2) {
    return (member1.persons[0].lastname + ' ' + member1.persons[0].firstname)
      .localeCompare(member2.persons[0].lastname + ' ' + member2.persons[0].firstname)
  }
}

