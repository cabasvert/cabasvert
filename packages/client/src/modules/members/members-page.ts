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

import { Component, ViewChild } from "@angular/core"
import { Content } from "ionic-angular"
import { Observable } from "rxjs/Observable"
import { BehaviorSubject } from "rxjs/BehaviorSubject"
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  merge,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { Subscription } from "rxjs/Subscription"

import { IndexedScroller } from "../../toolkit/components/indexed-scroller"
import { Navigation } from "../../toolkit/providers/navigation"
import { contains, Group, groupBy } from "../../utils/arrays"
import { errors, filterNotNull, ignoreErrors } from "../../utils/observables"

import { ContractService } from "../contracts/contract.service"
import { Season } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

import { MemberDetailsPage } from "./member-details-page"
import { Member } from "./member.model"
import { MemberService } from "./member.service"
import { PersonEditPage } from "./person-edit-page"

const STAR_CHAR = '★'
const ALPHA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

@Component({
  selector: 'page-members',
  templateUrl: './members-page.html',
  providers: [Navigation],
})
export class MembersPage {

  filter: string
  seasonFilter$ = new BehaviorSubject('all')

  todaysSeason$: Observable<Season>

  seasons$: Observable<Season[]>

  createdMember = new Subject<void>()
  searchQuery = new Subject<string>()
  shownMember = new BehaviorSubject<Member>(null)

  members$: Observable<Group<Member>[]>
  memberDetails$: Observable<Member>

  perMemberIdProblemSeverity: { [memberId: string]: string }

  error$: Observable<string>

  alphabeticLabels: string[] = (STAR_CHAR + ALPHA_LETTERS).split('')

  @ViewChild(IndexedScroller) scroller: IndexedScroller
  @ViewChild(Content) content: Content

  subscription = new Subscription()

  constructor(private nav: Navigation,
              private members: MemberService,
              private seasons: SeasonService,
              private contracts: ContractService) {

    this.filter = this.seasonFilter$.getValue()
  }

  ionViewDidLoad() {
    this.todaysSeason$ = this.seasons.todaysSeason$
    this.seasons$ = this.seasons.lastSeasons$(2).pipe(map(ss => ss.reverse()))

    let seasonContracts$ = this.seasons$.pipe(
      combineLatest(this.seasonFilter$, this.todaysSeason$, (ss, f, ts) => f == 'all' ? ts : ss.find(s => s.id == f)),
      switchMap(s => this.contracts.getSeasonContracts$(s)),
      publishReplay(1),
      refCount(),
    )
    let seasonMemberIds$ = seasonContracts$.pipe(
      map(cs => cs.map(c => c.member)),
    )

    let allMembers$ = this.members.getMembers$()
    let filteredMembers$ = allMembers$.pipe(
      combineLatest(seasonMemberIds$, this.seasonFilter$, (ms, mids, seasonFilter) => {
        if (seasonFilter != 'all') return ms.filter(m => contains(mids, m._id))
        else return ms
      }),
    )

    let members$ = filteredMembers$.pipe(
      combineLatest(
        this.searchQuery.pipe(
          startWith(''),
          distinctUntilChanged()
        )
      ),
      map(([ms, q]) => !q || q == '' ? ms : ms.filter(MembersPage.memberMatches(q))),
      map(ms => ms.sort(MembersPage.memberCompare)),
      map(ms => groupBy(ms, m => MembersPage.firstLastnameLetter(m))),
      publishReplay(1),
      refCount(),
    )

    this.members$ = members$.pipe(ignoreErrors())

    this.memberDetails$ = this.shownMember.pipe(
      filter(m => !m),
      merge(this.members.withChanges$(this.shownMember.pipe(filterNotNull()))),
      publishReplay(1),
      refCount(),
    )

    this.subscription.add(
      seasonContracts$.pipe(
        map(cs =>
          cs.reduce((acc, c) => {
            let problems = ContractService.validateContract(c)
            let severity = ContractService.contractValidationSeverity(problems)

            if (severity) acc[c.member] = severity
            return acc
          }, {})
        ),
        publishReplay(1),
        refCount(),
      ).subscribe(perIdSeverity => {
        this.perMemberIdProblemSeverity = perIdSeverity
      })
    )

    this.subscription.add(
      this.shownMember.pipe(
        filterNotNull(),
        switchMap(m =>
          this.nav.push(MemberDetailsPage, {
            member$: this.memberDetails$,
          })
        ),
        mapTo(null),
      ).subscribe(this.shownMember)
    )

    let data = {
      title: 'MEMBER.CREATION_TITLE',
      person: {},
    }
    this.subscription.add(
      this.createdMember.pipe(
        switchMap(() => this.nav.push(PersonEditPage, data)),
        filterNotNull(),
        map(p => ({
          _id: `member:${p.lastname}`, // FIXME This is very fragile
          type: 'member',
          srev: 'v1',
          persons: [p],
        })),
        switchMap(m => this.members.putMember$(m).pipe(mapTo(m))),
      ).subscribe(m => {
        this.shownMember.next(m)
      })
    )

    this.error$ = members$.pipe(errors())

    this.subscription.add(
      this.scroller.scrollToIndex$.pipe(
        combineLatest(this.members$, (i, groups) => {
          let laterLabels = this.alphabeticLabels.slice(i)
          let group = groups.find(mg => contains(laterLabels, mg.key))
          return group ? group.key : null
        }),
      ).subscribe(label => {
        if (!label) this.content.scrollToBottom()

        let element = document.getElementById('divider-' + label)
        if (!element) return

        this.content.scrollTo(0, element.offsetTop, 300)
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  private static memberCompare(member1, member2) {
    return (member1.persons[0].lastname + ' ' + member1.persons[0].firstname)
      .localeCompare(member2.persons[0].lastname + ' ' + member2.persons[0].firstname)
  }

  private static memberMatches(query) {
    return member => member.persons.some(
      p => (p.lastname && p.lastname.toLowerCase().includes(query))
        || (p.firstname && p.firstname.toLowerCase().includes(query))
        || (p.emailAddress && p.emailAddress.toLowerCase().includes(query)))
  }

  private static firstLastnameLetter(member: Member) {
    let firstLetter = member.persons[0].lastname.charAt(0).toLocaleUpperCase()
    if (firstLetter == ' ') return STAR_CHAR
    else return firstLetter
  }
}
