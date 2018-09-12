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

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Content, NavController } from '@ionic/angular';
import { combineLatest, Observable, Subject, Subscription, timer } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
  scan,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { IndexedScroller } from '../../toolkit/components/indexed-scroller';
import { Navigation } from '../../toolkit/providers/navigation';
import { contains, Group, groupBy } from '../../utils/arrays';
import { debug, errors, ignoreErrors } from '../../utils/observables';

import { ContractService } from '../contracts/contract.service';
import { Season } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';
import { Member } from './member.model';
import { MemberService } from './member.service';
import { PersonEditFormComponent } from './person-edit-form.component';

const STAR_CHAR = '★';
const ALPHA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Component({
  selector: 'page-members',
  templateUrl: './members-page.html',
  styleUrls: ['./members-page.scss'],
  providers: [Navigation],
})
export class MembersPage implements OnInit, AfterViewInit, OnDestroy {

  constructor(private navCtrl: NavController,
              private route: ActivatedRoute,
              private nav: Navigation,
              private members: MemberService,
              private seasons: SeasonService,
              private contracts: ContractService) {
  }

  seasonFilterToggle$ = new Subject<string>();
  seasonFilter$: Observable<SeasonFilter>;

  seasons$: Observable<Season[]>;

  searchQuery = new Subject<string>();

  members$: Observable<Group<Member>[]>;
  memberDetails$: Observable<Member>;

  perMemberIdProblemSeverity: { [memberId: string]: string };

  error$: Observable<string>;

  alphabeticLabels: string[] = (STAR_CHAR + ALPHA_LETTERS).split('');

  @ViewChild(IndexedScroller) scroller: IndexedScroller;
  @ViewChild(Content) content: Content;

  subscription = new Subscription();

  private static memberCompare(member1, member2) {
    return (member1.persons[0].lastname + ' ' + member1.persons[0].firstname)
      .localeCompare(member2.persons[0].lastname + ' ' + member2.persons[0].firstname);
  }

  private static memberMatches(query) {
    return member => member.persons.some(
      p => (p.lastname && p.lastname.toLowerCase().includes(query))
        || (p.firstname && p.firstname.toLowerCase().includes(query))
        || (p.emailAddress && p.emailAddress.toLowerCase().includes(query)));
  }

  private static firstLastnameLetter(member: Member) {
    const firstLetter = member.persons[0].lastname.charAt(0).toLocaleUpperCase();
    if (firstLetter === ' ') {
      return STAR_CHAR;
    } else {
      return firstLetter;
    }
  }

  ngOnInit() {
    this.seasons$ = this.seasons.lastSeasons$(2).pipe(
      map(ss => ss.reverse()),
      publishReplay(1),
      refCount(),
    );

    const seasonMemberFilters$ = this.seasons$.pipe(
      switchMap(ss => combineLatest(ss.map(s =>
        this.contracts.getSeasonContracts$(s).pipe(
          map(cs => cs.map(c => c.member)),
          map(mids => m => contains(mids, m._id)),
          startWith(null),
        ),
      ))),
      filter(fs => fs.every(f => !!f)),
      publishReplay(1),
      refCount(),
    );

    this.seasonFilter$ = this.seasonFilterToggle$.pipe(
      scan<string, SeasonFilter>((acc, id) => acc.toggle(id), new SeasonFilter()),
      startWith(new SeasonFilter()),
      publishReplay(1),
      refCount(),
    );

    const seasonMemberFilter$ =
      combineLatest(this.seasonFilter$, this.seasons$, seasonMemberFilters$).pipe(
        map(([f, ss, scs]) =>
          f.hasNone() ? null : ss.reduce<(m: Member) => boolean>(
            (acc, s, i) => {
              const flag = f.get(s.id);
              return m => acc(m) && (flag === undefined || (scs[i] && scs[i](m) === flag));
            },
            m => true,
          )),
        publishReplay(1),
        refCount(),
      );

    const allMembers$ = this.members.getMembers$();
    const filteredMembers$ =
      combineLatest(allMembers$, seasonMemberFilter$).pipe(
        map(([ms, f]) => {
          if (f) {
            return ms.filter(m => f(m));
          } else {
            return ms;
          }
        }),
        publishReplay<Member[]>(1),
        refCount(),
      );

    const members$ =
      combineLatest(
        filteredMembers$,
        this.searchQuery.pipe(
          startWith(''),
          distinctUntilChanged(),
        ),
      ).pipe(
        map(([ms, q]) => !q || q === '' ? ms : ms.filter(MembersPage.memberMatches(q))),
        map(ms => ms.sort(MembersPage.memberCompare)),
        map(ms => groupBy(ms, m => MembersPage.firstLastnameLetter(m))),
        publishReplay(1),
        refCount(),
      );

    this.members$ = members$.pipe(ignoreErrors());
    this.error$ = members$.pipe(errors());

    this.subscription.add(
      this.contracts.perMemberIdProblemSeverity$().subscribe(perIdSeverity => {
        this.perMemberIdProblemSeverity = perIdSeverity;
      }),
    );
  }

  ngAfterViewInit() {
    this.subscription.add(
      combineLatest(this.scroller.scrollToIndex$, this.members$).pipe(
        map(([i, groups]) => {
          const laterLabels = this.alphabeticLabels.slice(i);
          const group = groups.find(mg => contains(laterLabels, mg.key));
          return group ? group.key : null;
        }),
      ).subscribe(label => {
        if (!label) {
          this.content.scrollToBottom();
        }

        const element = document.getElementById('divider-' + label);
        if (!element) return;

        this.content.scrollToPoint(0, element.offsetTop);
      }),
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async scrollToMember(member: Member) {
    // FIXME Find a better way to wait for list to update

    let element;
    for (let i = 0; i < 10; i++) {
      element = document.getElementById('member-' + member._id);
      await timer(100).toPromise();
      if (element) break;
    }
    if (!element) return;

    await this.content.scrollToPoint(0, element.offsetTop);
  }

  async goToMember(member: Member) {
    await this.navCtrl.navigateForward(['/members', member._id]);
  }

  async createAndGoToMember() {
    this.nav.showEditDialog$({
      component: PersonEditFormComponent,
      data: {
        title: 'MEMBER.CREATION_TITLE',
        person: {},
      },
    }).pipe(
      map(p => ({
        _id: `member:${p.lastname}`, // FIXME This is very fragile
        type: 'member',
        srev: 'v1',
        persons: [p],
      })),
      switchMap(m => this.members.putMember$(m)),
      take(1),
      tap(m => this.scrollToMember(m)),
      tap(m => this.goToMember(m)),
    ).subscribe();
  }

  groupKey(index: number, group: Group<Member>) {
    return group.key;
  }

  memberId(index: number, member: Member) {
    return member._id;
  }
}

class SeasonFilter {

  constructor(private flags: { [id: string]: boolean } = {}) {
  }

  toggle(id: string): this {
    if (this.flags[id] === undefined) {
      this.flags[id] = true;
    } else if (this.flags[id]) {
      this.flags[id] = false;
    } else {
      this.flags[id] = undefined;
    }

    return this;
  }

  hasNone(): boolean {
    return Object.getOwnPropertyNames(this.flags).every(id => this.flags[id] === undefined);
  }

  get(id: string): boolean | undefined {
    return this.flags[id] == null ? undefined : this.flags[id];
  }

  colorFor(id: string): string {
    return this.flags[id] === undefined ? 'inactive' : this.flags[id] ? 'primary' : 'danger';
  }
}
