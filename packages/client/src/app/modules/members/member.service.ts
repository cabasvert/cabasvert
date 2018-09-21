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

import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { DatabaseService } from '../../toolkit/providers/database-service';
import { UidService } from '../../toolkit/providers/uid-service';
import '../../utils/dates';
import { objectAssignNoNulls } from '../../utils/objects';
import { Season, SeasonWeek } from '../seasons/season.model';
import { Member, TrialBasket } from './member.model';

@Injectable()
export class MemberService implements OnDestroy {

  private members$: Observable<Member[]>;
  private membersIndexed$: Observable<Map<string, Member>>;

  private _subscription = new Subscription();

  constructor(private mainDatabase: DatabaseService,
              private uidService: UidService) {

    this._subscription.add(this.getMembersIndexed$().subscribe());
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  getMembers$(): Observable<Member[]> {
    if (this.members$ != null) return this.members$;

    let { query, index } = this.membersQuery();

    this.members$ = this.mainDatabase.findAll$<Member>(index, query);

    return this.members$;
  }

  getMembersIndexed$(): Observable<Map<string, Member>> {
    if (this.membersIndexed$ != null) return this.membersIndexed$;

    let { query, index } = this.membersQuery();

    this.membersIndexed$ = this.mainDatabase.findAllIndexed$<Member>(index, query);

    return this.membersIndexed$;
  }

  private membersQuery() {
    let query = {
      selector: {
        type: 'member',
      },
    };

    let index = {
      index: {
        fields: ['type'],
      },
    };

    return { query, index };
  }

  getMemberById$(id: string): Observable<Member> {
    return this.getMembersIndexed$().pipe(
      map(msi => msi.get(id)),
    );
  }

  getMember$(lastname: string, firstname: string): Observable<Member> {
    return this.getMembers$().pipe(map(ms =>
      ms.find(m =>
        m.persons.some(p => p.firstname === firstname && p.lastname === lastname),
      ),
    ));
  }

  putMember$(member: Member): Observable<Member> {
    if (!member.persons || member.persons.length === 0)
      throw new Error('Member must have at least one person');

    if (member._id === undefined) {
      let person = member.persons[0];
      let uid = this.uidService.generate();

      member = objectAssignNoNulls({}, member, {
        _id: `member:${person.lastname}-${person.firstname}-${uid}`,
        type: 'member',
        srev: 'v1',
      });
    }

    return this.mainDatabase.put$(member);
  }

  // TODO Move these methods to Member class when it becomes one

  static memberHasTrialBasket(member: Member): boolean {
    return !!member.trialBaskets && member.trialBaskets.length > 0;
  }

  static memberHasTrialBasketForSeason(member: Member, seasonId: string): boolean {
    return !!member.trialBaskets && member.trialBaskets.some(b =>
      b.season === seasonId,
    );
  }

  static memberHasTrialBasketForWeek(member: Member, week: SeasonWeek): boolean {
    return !!member.trialBaskets && member.trialBaskets.some(b =>
      b.season === week.season.id && b.week === week.seasonWeek,
    );
  }

  static memberGetTrialBasketForWeek(member: Member, week: SeasonWeek): TrialBasket {
    return member.trialBaskets && member.trialBaskets.find(b =>
      b.season === week.season.id && b.week === week.seasonWeek,
    );
  }
}
