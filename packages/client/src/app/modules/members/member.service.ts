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

import { Injectable, OnDestroy } from '@angular/core'
import { SeasonWeek } from '@cabasvert/data'
import { combineLatest, merge, Observable, Subscription } from 'rxjs'
import { map, mergeAll, scan, switchMap } from 'rxjs/operators'

import { DatabaseService } from '../../toolkit/providers/database-service'
import { UidService } from '../../toolkit/providers/uid-service'
import { objectAssignNoNulls } from '../../utils/objects'
import { ContractService } from '../contracts/contract.service'
import { SeasonService } from '../seasons/season.service'
import { Member, TrialBasket } from './member.model'

@Injectable()
export class MemberService implements OnDestroy {

  public readonly allMembers$: Observable<Member[]>
  public readonly allMembersIndexed$: Observable<Map<string, Member>>

  private _subscription = new Subscription()

  constructor(private mainDatabase: DatabaseService,
              private contractService: ContractService,
              private seasonService: SeasonService,
              private uidService: UidService) {

    this.createIndexes()

    // All members
    let query = {
      selector: {
        type: 'member',
      },
      use_index: 'type',
    }

    this.allMembers$ = this.mainDatabase.findAll$<Member>(query)
    this.allMembersIndexed$ = this.mainDatabase.findAllIndexed$<Member>(query)

    this._subscription.add(this.allMembersIndexed$.subscribe())
  }

  createIndexes() {
    this._subscription.add(
      this.mainDatabase.createIndex({ index: { fields: ['type'], ddoc: 'type' } }),
    )
  }

  ngOnDestroy() {
    this._subscription.unsubscribe()
  }

  memberById$(id: string): Observable<Member> {
    return this.allMembersIndexed$.pipe(
      map(msi => msi.get(id)),
    )
  }

  memberByNames$(lastname: string, firstname: string): Observable<Member> {
    return this.allMembers$.pipe(map(ms =>
      ms.find(m =>
        m.persons.some(p => p.firstname === firstname && p.lastname === lastname),
      ),
    ))
  }

  putMember$(member: Member): Observable<Member> {
    if (!member.persons || member.persons.length === 0)
      throw new Error('Member must have at least one person')

    if (member._id === undefined) {
      let person = member.persons[0]
      let uid = this.uidService.generate()

      member = objectAssignNoNulls({}, member, {
        _id: `member:${person.lastname}-${person.firstname}-${uid}`,
        type: 'member',
        srev: 'v1',
      })
    }

    return this.mainDatabase.put$(member)
  }

  removeMember$(member: Member): Observable<boolean> {
    const removeContracts$ = this.contractService.contractsByMember$(member).pipe(
      mergeAll(),
      switchMap(contract => this.contractService.removeContracts$(contract)),
    )

    const removeAll$ = merge(removeContracts$, this.mainDatabase.remove$(member))

    return removeAll$.pipe(scan((allDone, done) => allDone && done))
  }

  memberHasRecentContracts(member: Member): Observable<boolean> {
    const lastFourSeasons$ = this.seasonService.latestSeasons$(4)
    let contracts$ = this.contractService.contractsByMember$(member)
    return combineLatest([contracts$, lastFourSeasons$]).pipe(
      map(([cs, ss]) => cs.reduce((hasRecentContracts, c) => hasRecentContracts || ss.some(s => s.id === c.season), false))
    )
  }

  // TODO Move these methods to Member class when it becomes one

  static memberHasTrialBasket(member: Member): boolean {
    return !!member.trialBaskets && member.trialBaskets.length > 0
  }

  static memberHasTrialBasketForSeason(member: Member, seasonId: string): boolean {
    return !!member.trialBaskets && member.trialBaskets.some(b =>
      b.season === seasonId,
    )
  }

  static memberHasTrialBasketForWeek(member: Member, week: SeasonWeek): boolean {
    return !!member.trialBaskets && member.trialBaskets.some(b =>
      b.season === week.season.id && b.week === week.seasonWeek,
    )
  }

  static memberGetTrialBasketForWeek(member: Member, week: SeasonWeek): TrialBasket {
    return member.trialBaskets && member.trialBaskets.find(b =>
      b.season === week.season.id && b.week === week.seasonWeek,
    )
  }
}
