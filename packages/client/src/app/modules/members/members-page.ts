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

import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Content, NavController } from '@ionic/angular';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  publishReplay,
  refCount,
  scan,
  skipWhile,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { IndexedScroller } from '../../toolkit/components/indexed-scroller';
import { Navigation } from '../../toolkit/providers/navigation';
import { contains, Group, groupBy } from '../../utils/arrays';
import { observeInsideAngular, observeOutsideAngular } from '../../utils/observables';
import { timeout } from '../../utils/promises';

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
              private contracts: ContractService,
              private ngZone: NgZone) {
  }

  filterToggle$ = new Subject<string>();
  filter$: Observable<Filter>;

  seasons$: Observable<Season[]>;

  searchBarUnfolded = false;
  searchQuery$ = new Subject<string>();

  members$: Observable<Group<Member>[]>;
  memberDetails$: Observable<Member>;

  perMemberIdProblemSeverity: Map<string, string>;

  alphabeticLabels: string[] = (STAR_CHAR + ALPHA_LETTERS).split('');

  @ViewChild(IndexedScroller) scroller: IndexedScroller;
  @ViewChild(Content) content: Content;

  subscription = new Subscription();

  private static memberCompare(member1, member2) {
    return (member1.persons[0].lastname + ' ' + member1.persons[0].firstname)
      .localeCompare(member2.persons[0].lastname + ' ' + member2.persons[0].firstname);
  }

  private static memberMatches(query) {
    let lowerCaseQuery = query.toLowerCase();
    return member => member.persons.some(
      p => (p.lastname && p.lastname.toLowerCase().includes(lowerCaseQuery))
        || (p.firstname && p.firstname.toLowerCase().includes(lowerCaseQuery))
        || (p.emailAddress && p.emailAddress.toLowerCase().includes(lowerCaseQuery)));
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
    this.seasons$ = this.seasons.latestSeasons$(2).pipe(
      map(ss => ss.reverse()),
      publishReplay(1),
      refCount(),
    );

    const filters$ = this.seasons$.pipe(
      observeOutsideAngular(this.ngZone),
      switchMap(ss => combineLatest(
        // Season filters
        ss.map(s =>
          this.contracts.contractsBySeason$(s).pipe(
            map(cs => cs.indexedAsMap(c => c.member)),
            map(csi => m => MemberService.memberHasTrialBasketForSeason(m, s.id) || csi.has(m._id)),
            startWith(null),
            map(f => ({ id: s.id, filter: f })),
          ),
        ).concat(
          // Contract filter
          this.contracts.allContracts$.pipe(
            map(cs => cs.indexedAsMap(c => c.member)),
            map(csi => m => csi.has(m._id)),
            startWith(null),
            map(f => ({ id: 'contract', filter: f })),
          ),

          // Trial baskets filter
          of({ id: 'trial', filter: m => MemberService.memberHasTrialBasket(m) }),

          // Problem filter
          this.contracts.perMemberIdProblemSeverity$.pipe(
            map(m2ps => m => m2ps.has(m._id)),
            startWith(null),
            map(f => ({ id: 'problem', filter: f })),
          ),
        ),
      )),
      filter(fs => fs.every(f => !!f)),
      publishReplay(1),
      refCount(),
    );

    this.filter$ = this.filterToggle$.pipe(
      scan<string, Filter>((acc, id) => acc.toggle(id), new Filter()),
      startWith(new Filter()),
      publishReplay(1),
      refCount(),
    );

    const seasonMemberFilter$ =
      combineLatest(this.filter$, filters$).pipe(
        observeOutsideAngular(this.ngZone),
        map(([ff, fs]) =>
          ff.hasNone() ? null : fs.reduce<(m: Member) => boolean>(
            (acc, f) => {
              const flag = ff.get(f.id);
              return m => acc(m) && (flag === undefined || (f.filter && f.filter(m) === flag));
            },
            () => true,
          )),
        startWith(null),
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
      );

    const allMembers$ = this.members.allMembers$.pipe(
      observeOutsideAngular(this.ngZone),
      publishReplay(1),
      refCount(),
    );
    const filteredMembers$ =
      combineLatest(allMembers$, seasonMemberFilter$).pipe(
        map(([ms, f]) => {
          if (f) {
            return ms.filter(m => f(m));
          } else {
            return ms;
          }
        }),
        publishReplay(1),
        refCount(),
      );

    this.members$ =
      combineLatest(
        filteredMembers$,
        this.searchQuery$.pipe(
          startWith(''),
          distinctUntilChanged(),
          observeOutsideAngular(this.ngZone),
        ),
      ).pipe(
        map(([ms, q]) => !q || q === '' ? ms : ms.filter(MembersPage.memberMatches(q))),
        map(ms => ms.sort(MembersPage.memberCompare)),
        map(ms => groupBy(ms, m => MembersPage.firstLastnameLetter(m))),
        observeInsideAngular(this.ngZone),
        startWith(null),
        publishReplay(1),
        refCount(),
      );

    this.subscription.add(
      this.contracts.perMemberIdProblemSeverity$.subscribe(perIdSeverity => {
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

  async toggleSearchBar() {
    this.searchBarUnfolded = !this.searchBarUnfolded;
  }

  async scrollToMember(member: Member) {
    // Asynchronously wait for the member item to be created.
    await this.memberExists(member);

    // If the filters are not set adequately, we won't be able to scroll.
    // Should we reset the member filters ? (Only for member creation)
    let element = document.getElementById('member-' + member._id);
    if (!element) return;

    // Await next round for the element to get a change to layout.
    // Or else, the scroll point will be at the next item.
    await timeout(0);

    await this.content.scrollToPoint(0, element.offsetTop);
  }

  async goToMember(member: Member) {
    // Asynchronously wait for the member item to be created.
    // This ensures that member creation has been propagated.
    // Or else, the route's Resolve guard may fail.
    await this.memberExists(member);

    await this.navCtrl.navigateForward(['/members', member._id]);
  }

  private memberExists(member: Member): Promise<void> {
    return this.members.allMembersIndexed$.pipe(
      map(msi => msi.has(member._id)),
      skipWhile(exists => !exists),
      take(1),
      mapTo(null),
    ).toPromise();
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
        _id: undefined,
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

class Filter {

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
