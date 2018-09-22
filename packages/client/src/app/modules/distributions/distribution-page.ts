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
import { ActivatedRoute, Router } from '@angular/router';

import { Content, ModalController, NavController } from '@ionic/angular';
import { combineLatest, merge, Observable, of, Subject, Subscription } from 'rxjs';
import {
  map,
  mapTo,
  mergeScan,
  publishReplay,
  refCount,
  startWith,
  switchAll,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { IndexedScroller } from '../../toolkit/components/indexed-scroller';
import { ItemExpanding } from '../../toolkit/components/item-expanding';
import { SlidingPanes } from '../../toolkit/components/sliding-panes';
import { Navigation } from '../../toolkit/providers/navigation';
import { contains, Group, groupBy } from '../../utils/arrays';

import { ContractKind } from '../contracts/contract.model';
import { ContractService } from '../contracts/contract.service';
import { Member } from '../members/member.model';
import { MemberService } from '../members/member.service';
import { SeasonWeek } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';

import { Basket, Distribution } from './distribution.model';
import { DistributionService } from './distribution.service';
import { NotePopup } from './note-popup';

const STAR_CHAR = '★';
const ALPHA_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Component({
  selector: 'page-distribution',
  templateUrl: 'distribution-page.html',
  styleUrls: ['distribution-page.scss'],
  providers: [Navigation],
})
export class DistributionPage implements OnInit, AfterViewInit, OnDestroy {

  constructor(private router: Router,
              private navCtrl: NavController,
              private route: ActivatedRoute,
              private nav: Navigation,
              private modalCtrl: ModalController,
              private memberService: MemberService,
              private seasonService: SeasonService,
              private distributionService: DistributionService,
              private contractService: ContractService) {
  }

  Kinds = ContractKind;

  previousWeekClicks$ = new Subject();
  nextWeekClicks$ = new Subject();

  filter = 'remaining';

  alphabeticLabels: string[] = (STAR_CHAR + ALPHA_LETTERS).split('');

  week$: Observable<SeasonWeek>;

  distributedBaskets$: Observable<Basket[]>;
  remainingBaskets$: Observable<Group<Basket>[]>;
  delayedBaskets$: Observable<Basket[]>;

  distributedBasketsCount$: Observable<any>;
  remainingBasketsCount$: Observable<any>;
  delayedBasketsCount$: Observable<any>;

  distribution$: Observable<Distribution>;

  previousDisablement$: Observable<boolean>;
  nextDisablement$: Observable<boolean>;

  private subscription = new Subscription();
  distribution: Distribution;
  private perMemberIdProblemSeverity: Map<string, string>;

  @ViewChild(SlidingPanes) private panes: SlidingPanes;

  @ViewChild('secondPaneContent') secondPaneContent: Content;
  @ViewChild('secondPaneScroller') secondPaneScroller: IndexedScroller;

  private static firstLastnameLetter(member: Member) {
    let firstLetter = member.persons[0].lastname.charAt(0).toLocaleUpperCase();
    if (firstLetter === ' ') {
      return STAR_CHAR;
    } else {
      return firstLetter;
    }
  }

  private _groupedRemainingBaskets$: Observable<any>;

  ngOnInit() {
    let date$ = this.route.paramMap.pipe(
      map(params => params.get('date')),
      map(dateString => !dateString ? new Date() : new Date(dateString)),
    );

    let initialWeek$ = date$.pipe(
      switchMap(date => this.seasonService.seasonWeekForDate$(date))
    );

    let previousNextClicks$ =
      merge(
        of(0),
        this.previousWeekClicks$.pipe(map(() => -1)),
        this.nextWeekClicks$.pipe(map(() => +1)),
      );

    this.week$ = previousNextClicks$.pipe(
      mergeScan((w, pn) => {
        if (pn === 0) {
          return initialWeek$;
        } else if (pn < 0) {
          return w.previousWeek$();
        } else {
          return w.nextWeek$();
        }
      }, null),
      publishReplay(1),
      refCount(),
    );

    let baskets$ = this.week$.pipe(
      switchMap(week => this.distributionService.basketsForWeek$(week)),
      publishReplay(1),
      refCount(),
    );

    let basketsAndDistribution$ = baskets$.pipe(
      withLatestFrom(this.week$,
        (baskets, week) => this.distributionService.distributionForWeek$(week).pipe(
          map(distribution => ({ baskets, distribution })),
        ),
      ),
      switchAll(),
      publishReplay(1),
      refCount(),
    );

    let allBaskets$ = basketsAndDistribution$.pipe(map(({ baskets, ..._ }) => baskets));
    let distribution$ = basketsAndDistribution$.pipe(map(({ distribution, ..._ }) => distribution));

    let allBasketsIndexed$ = allBaskets$.pipe(
      map(bs => bs.indexedAsMap(b => b.member._id)),
    );
    let distributedBaskets$ = combineLatest(allBasketsIndexed$, distribution$).pipe(
      map(([ibs, distribution]) =>
        distribution.baskets
          .filter(db => db.distributed)
          .sort((db1, db2) => new Date(db2.date).getTime() - new Date(db1.date).getTime())
          .map(db => ibs.get(db.member))
          .filter(b => !!b),
      ),
      publishReplay(1),
      refCount(),
    );

    let distributedBasketsCount$ = distributedBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    );

    let allRemainingBaskets$ = combineLatest(allBaskets$, distribution$).pipe(
      map(([bs, distribution]) =>
        bs.filter(b => !distribution.isBasketDistributed(b) && !distribution.isBasketDelayed(b)),
      ),
      publishReplay(1),
      refCount(),
    );

    this._groupedRemainingBaskets$ = allRemainingBaskets$.pipe(
      map((bs: Basket[]) => groupBy(bs, b => DistributionPage.firstLastnameLetter(b.member))),
      publishReplay(1),
      refCount(),
    );

    let remainingBasketsCount$ = allRemainingBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    );

    let delayedBaskets$ = combineLatest(allBaskets$, distribution$).pipe(
      map(([bs, distribution]) =>
        bs.filter(b => !distribution.isBasketDistributed(b) && distribution.isBasketDelayed(b)),
      ),
      publishReplay(1),
      refCount(),
    );

    let delayedBasketsCount$ = delayedBaskets$.pipe(
      map(bs => bs.length),
      publishReplay(1),
      refCount(),
    );

    let moves$ = previousNextClicks$.pipe(mapTo(null));
    this.distribution$ = merge(moves$, distribution$);

    this.distributedBaskets$ = merge(moves$, distributedBaskets$);
    this.distributedBasketsCount$ = merge(moves$, distributedBasketsCount$);
    this.remainingBaskets$ = merge(moves$, this._groupedRemainingBaskets$);
    this.remainingBasketsCount$ = merge(moves$, remainingBasketsCount$);
    this.delayedBaskets$ = merge(moves$, delayedBaskets$);
    this.delayedBasketsCount$ = merge(moves$, delayedBasketsCount$);

    let navigationDisablement$ =
      combineLatest(
        [
          this.distribution$,
          this.distributedBaskets$,
          this.distributedBasketsCount$,
          this.remainingBaskets$,
          this.remainingBasketsCount$,
          this.delayedBaskets$,
          this.delayedBasketsCount$,
        ],
      ).pipe(
        map(values => values.some(v => v === null)),
      );

    this.previousDisablement$ = combineLatest(
      navigationDisablement$,
      this.week$.pipe(
        switchMap(w => w.previousWeek$().pipe(startWith(null))),
        map(w => w == null),
      ),
    ).pipe(
      map(([d1, d2]) => d1 || d2),
    );

    this.nextDisablement$ = combineLatest(
      navigationDisablement$,
      this.week$.pipe(
        switchMap(w => w.nextWeek$().pipe(startWith(null))),
        map(w => w == null),
      ),
    ).pipe(
      map(([d1, d2]) => d1 || d2),
    );

    this.subscription.add(
      distribution$.subscribe(distribution => {
        this.distribution = distribution;
      }),
    );

    this.subscription.add(
      this.week$.pipe(
        switchMap(w =>
          this.contractService.contractsBySeason$(w.season).pipe(
            map(cs => ContractService.computePerMemberIdProblemSeverity(cs)),
          ),
        ),
        publishReplay(1),
        refCount(),
      ).subscribe(perIdSeverity => {
        this.perMemberIdProblemSeverity = perIdSeverity;
      }),
    );
  }

  ngAfterViewInit() {
    this.subscription.add(
      combineLatest(this.secondPaneScroller.scrollToIndex$, this._groupedRemainingBaskets$).pipe(
        map(([i, groups]) => {
          let laterLabels = this.alphabeticLabels.slice(i);
          let group = groups.find(mg => contains(laterLabels, mg.key));
          return group ? group.key : null;
        }),
      ).subscribe(label => {
        if (!label) {
          this.secondPaneContent.scrollToBottom();
        }

        let element = document.getElementById('divider-' + label);
        if (!element) {
          return;
        }

        this.secondPaneContent.scrollToPoint(0, element.offsetTop);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  contractProblems(member: Member): string {
    return this.perMemberIdProblemSeverity && this.perMemberIdProblemSeverity.get(member._id);
  }

  async goToMemberPage(member: Member, item: ItemExpanding) {
    await this.navCtrl.navigateForward(['/members', member._id]);
    item.close();
  }

  isTrialBasketPaid(basket: Basket, item: ItemExpanding): boolean {
    let trialBasket = MemberService.memberGetTrialBasketForWeek(basket.member, this.distribution.week);
    return trialBasket ? trialBasket.paid : null;
  }

  toggleTrialBasketPaid(basket: Basket, item: ItemExpanding) {
    let trialBasket = MemberService.memberGetTrialBasketForWeek(basket.member, this.distribution.week);
    trialBasket.paid = !trialBasket.paid;
    this.memberService.putMember$(basket.member).subscribe();
    item.close();
  }

  toggleBasketDistributed(basket: Basket, item: ItemExpanding) {
    this.distribution.toggleBasketDistributed(basket);
    item.close();
  }

  toggleBasketDelayed(basket: Basket, item: ItemExpanding) {
    this.distribution.toggleBasketDelayed(basket);
    item.close();
  }

  async setNote(basket: Basket, item: ItemExpanding) {

    let note = this.distribution.getNoteFromBasket(basket);

    let modal = await this.modalCtrl.create({ component: NotePopup, componentProps: note });

    modal.onDidDismiss().then(newNote => {
      if (!newNote.data) {
        return;
      }
      if (newNote.data.content === '' && !note) {
        return;
      }
      this.distribution.pushNoteToBasket(basket, newNote.data);
    });

    await modal.present();
    item.close();
  }

  range(value: number) {
    let range = [];
    for (let i = 0; i < value; ++i) {
      range.push(i + 1);
    }
    return range;
  }

  basketDistributionDate(index: number, basket: Basket) {
    return !this.distribution ? index : this.distribution.getBasketDistributionDate(basket);
  }

  groupKey(index: number, group: Group<Member>) {
    return group.key;
  }

  basketMemberId(index: number, basket: Basket) {
    return basket.member._id;
  }
}

