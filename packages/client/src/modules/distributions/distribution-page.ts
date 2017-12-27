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

import { AfterViewInit, Component, Inject, OnDestroy, ViewChild } from '@angular/core'

import { Content, ModalController, NavController, NavParams, } from 'ionic-angular'
import { Observable } from "rxjs/Observable"
import { combineLatest as combineAllLatest } from "rxjs/observable/combineLatest"
import { of } from "rxjs/observable/of"
import {
  combineLatest,
  map,
  mapTo,
  merge,
  mergeScan,
  publishReplay,
  refCount,
  startWith,
  switchAll,
  switchMap,
  withLatestFrom,
} from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { Subscription } from "rxjs/Subscription"

import { Config } from "../../config/configuration.token"
import { IndexedScroller } from "../../toolkit/components/indexed-scroller"
import { ItemExpanding } from "../../toolkit/components/item-expanding"
import { SlidingPanes } from "../../toolkit/components/sliding-panes"
import { Navigation } from "../../toolkit/providers/navigation"
import { contains, Group, groupBy } from "../../utils/arrays"
import "../../utils/observables"

import { ContractKind } from "../contracts/contract.model"
import { ContractService } from "../contracts/contract.service"
import { MemberDetailsPage } from "../members/member-details-page"
import { Member } from "../members/member.model"
import { MemberService } from "../members/member.service"
import { SeasonWeek } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

import { Basket, Distribution } from "./distribution.model"
import { DistributionService } from './distribution.service'
import { NotePopup } from "./note-popup"

const STAR_CHAR = '★'
const ALPHA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

@Component({
  selector: 'page-distribution',
  templateUrl: 'distribution-page.html',
  providers: [Navigation],
})
export class DistributionPage implements AfterViewInit, OnDestroy {

  Kinds = ContractKind

  previousWeekClicks$ = new Subject()
  nextWeekClicks$ = new Subject()

  filter: string = 'remaining'

  alphabeticLabels: string[] = (STAR_CHAR + ALPHA_LETTERS).split('')

  week$: Observable<SeasonWeek>

  distributedBaskets$: Observable<Basket[]>
  remainingBaskets$: Observable<Group<Basket>[]>
  delayedBaskets$: Observable<Basket[]>

  distributedBasketsCount$: Observable<any>
  remainingBasketsCount$: Observable<any>
  delayedBasketsCount$: Observable<any>

  distribution$: Observable<Distribution>

  previousDisablement$: Observable<boolean>
  nextDisablement$: Observable<boolean>

  private subscription = new Subscription()
  distribution: Distribution
  private perMemberIdProblemSeverity: { [memberId: string]: string }

  constructor(@Inject(Config) private config,
              public nav: Navigation,
              public navCtrl: NavController,
              public modalCtrl: ModalController,
              public navParams: NavParams,
              public members: MemberService,
              public seasons: SeasonService,
              public distributions: DistributionService,
              public contracts: ContractService) {
  }

  @ViewChild(SlidingPanes) private panes: SlidingPanes

  @ViewChild('secondPaneContent') secondPaneContent: Content
  @ViewChild('secondPaneScroller') secondPaneScroller: IndexedScroller

  ngAfterViewInit() {
    let initialDate = this.navParams.get('datePicked') || new Date()

    let previousNextClicks$ = of(0).pipe(
      merge(
        this.previousWeekClicks$.pipe(map(() => -1)),
        this.nextWeekClicks$.pipe(map(() => +1))
      )
    )

    this.week$ = previousNextClicks$.pipe(
      mergeScan((w, pn) => {
        if (pn == 0) return this.seasons.seasonWeekForDate$(initialDate)
        else if (pn < 0) return w.previousWeek$()
        else return w.nextWeek$()
      }, null),
      publishReplay(1),
      refCount(),
    )

    let baskets$ = this.week$.pipe(
      switchMap(week => this.distributions.getBaskets$(week)),
      publishReplay(1),
      refCount(),
    )

    let basketsAndDistribution$ = baskets$.pipe(
      withLatestFrom(this.week$,
        (baskets, week) => this.distributions.getDistribution$(week).pipe(
          map(distribution => ({ baskets, distribution })),
        )
      ),
      switchAll(),
      publishReplay(1),
      refCount(),
    )

    let allBaskets$ = basketsAndDistribution$.pipe(map(({ baskets, ..._ }) => baskets))
    let distribution$ = basketsAndDistribution$.pipe(map(({ distribution, ..._ }) => distribution))

    let allBasketsIndexed$ = allBaskets$.pipe(
      map(bs =>
        bs.reduce((acc, b) => {
          acc[b.member._id] = b
          return acc
        }, {})
      ),
    )
    let distributedBaskets$ = allBasketsIndexed$.pipe(
      combineLatest(distribution$, (ibs, distribution) =>
        distribution.baskets
          .filter(db => db.distributed)
          .sort((db1, db2) => new Date(db2.date).getTime() - new Date(db1.date).getTime())
          .map(db => ibs[db.member])
          .filter(b => !!b)
      ),
      publishReplay(1),
      refCount(),
    )

    let distributedBasketsCount$ = distributedBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    )

    let allRemainingBaskets$ = allBaskets$.pipe(
      combineLatest(distribution$, (bs, distribution) =>
        bs.filter(b => !distribution.isBasketDistributed(b) && !distribution.isBasketDelayed(b))
      ),
      publishReplay(1),
      refCount(),
    )

    let groupedRemainingBaskets$ = allRemainingBaskets$.pipe(
      map((bs: Basket[]) => groupBy(bs, b => DistributionPage.firstLastnameLetter(b.member))),
      publishReplay(1),
      refCount(),
    )

    let remainingBasketsCount$ = allRemainingBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    )

    let delayedBaskets$ = allBaskets$.pipe(
      combineLatest(distribution$, (bs, distribution) =>
        bs.filter(b => !distribution.isBasketDistributed(b) && distribution.isBasketDelayed(b))
      ),
      publishReplay(1),
      refCount(),
    )

    let delayedBasketsCount$ = delayedBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    )

    let moves$ = previousNextClicks$.pipe(mapTo(null))
    this.distribution$ = moves$.pipe(merge(distribution$))

    this.distributedBaskets$ = moves$.pipe(merge(distributedBaskets$))
    this.distributedBasketsCount$ = moves$.pipe(merge(distributedBasketsCount$))
    this.remainingBaskets$ = moves$.pipe(merge(groupedRemainingBaskets$))
    this.remainingBasketsCount$ = moves$.pipe(merge(remainingBasketsCount$))
    this.delayedBaskets$ = moves$.pipe(merge(delayedBaskets$))
    this.delayedBasketsCount$ = moves$.pipe(merge(delayedBasketsCount$))

    let navigationDisablement$ =
      combineAllLatest(
        [
          this.distribution$,
          this.distributedBaskets$,
          this.distributedBasketsCount$,
          this.remainingBaskets$,
          this.remainingBasketsCount$,
          this.delayedBaskets$,
          this.delayedBasketsCount$
        ],
        (...values) => values.some(v => v === null)
      )

    this.previousDisablement$ = navigationDisablement$.pipe(
      combineLatest(
        this.week$.pipe(
          switchMap(w => w.previousWeek$().pipe(startWith(null))),
          map(w => w == null),
        ),
        (d1, d2) => d1 || d2
      ),
    )
    this.nextDisablement$ = navigationDisablement$.pipe(
      combineLatest(
        this.week$.pipe(
          switchMap(w => w.nextWeek$().pipe(startWith(null))),
          map(w => w == null),
        ),
        (d1, d2) => d1 || d2
      ),
    )

    this.subscription.add(
      distribution$.subscribe(distribution => {
        this.distribution = distribution
      }),
    )

    this.subscription.add(
      this.week$.pipe(
        switchMap(w =>
          this.contracts.getSeasonContracts$(w.season).pipe(
            map(cs =>
              cs.reduce((acc, c) => {
                let problems = ContractService.validateContract(c)
                let severity = ContractService.contractValidationSeverity(problems)

                if (severity) acc[c.member] = severity
                return acc
              }, {})
            )
          )
        ),
        publishReplay(1),
        refCount(),
      ).subscribe(perIdSeverity => {
        this.perMemberIdProblemSeverity = perIdSeverity
      })
    )

    this.subscription.add(
      this.secondPaneScroller.scrollToIndex$.pipe(
        combineLatest(groupedRemainingBaskets$, (i, groups) => {
          let laterLabels = this.alphabeticLabels.slice(i)
          let group = groups.find(mg => contains(laterLabels, mg.key))
          return group ? group.key : null
        }),
      ).subscribe(label => {
        if (!label) this.secondPaneContent.scrollToBottom()

        let element = document.getElementById('divider-' + label)
        if (!element) return

        this.secondPaneContent.scrollTo(0, element.offsetTop, 300)
      })
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  contractProblems(member: Member): string {
    return this.perMemberIdProblemSeverity && this.perMemberIdProblemSeverity[member._id]
  }

  goToMemberPage(member: Member, item: ItemExpanding) {
    this.navCtrl.push(MemberDetailsPage, {
      member$: of(member),
    })
    item.close()
  }

  isTrialBasketPaid(basket: Basket, item: ItemExpanding): boolean {
    let trialBasket = MemberService.memberGetTrialBasketForWeek(basket.member, this.distribution.week)
    return trialBasket ? trialBasket.paid : null
  }

  toggleTrialBasketPaid(basket: Basket, item: ItemExpanding) {
    let trialBasket = MemberService.memberGetTrialBasketForWeek(basket.member, this.distribution.week)
    trialBasket.paid = !trialBasket.paid
    this.members.putMember$(basket.member).subscribe()
    item.close()
  }

  toggleBasketDistributed(basket: Basket, item: ItemExpanding) {
    this.distribution.toggleBasketDistributed(basket)
    item.close()
  }

  toggleBasketDelayed(basket: Basket, item: ItemExpanding) {
    this.distribution.toggleBasketDelayed(basket)
    item.close()
  }

  setNote(basket: Basket, item: ItemExpanding) {
    let note = this.distribution.getNoteFromBasket(basket)

    let modal = this.modalCtrl.create(NotePopup, note)
    modal.onDidDismiss(newNote => {
      if (!newNote) return
      if (newNote.content == "" && !note) return
      this.distribution.pushNoteToBasket(basket, newNote)
    })
    modal.present()

    item.close()
  }

  private static firstLastnameLetter(member: Member) {
    let firstLetter = member.persons[0].lastname.charAt(0).toLocaleUpperCase()
    if (firstLetter == ' ') return STAR_CHAR
    else return firstLetter
  }

  range(value: number) {
    let range = []
    for (let i = 0; i < value; ++i) {
      range.push(i + 1)
    }
    return range
  }
}

