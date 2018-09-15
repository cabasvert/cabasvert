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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Plugins } from '@capacitor/core';
import { NavController, Platform } from '@ionic/angular';
import { Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';

import { AuthService, Roles, User } from '../../toolkit/providers/auth-service';
import { Navigation } from '../../toolkit/providers/navigation';
import { copyAdd, copyRemove, copyWith } from '../../utils/arrays';
import { Contract, ContractKind, ContractSection } from '../contracts/contract.model';
import { ContractService } from '../contracts/contract.service';
import { ContractsEditPage } from '../contracts/contracts-edit-page';
import { TrialBasketEditPage } from '../contracts/trial-basket-edit-page';
import { Season, SeasonWeek } from '../seasons/season.model';
import { SeasonService } from '../seasons/season.service';

import { Member, Person, TrialBasket } from './member.model';
import { MemberService } from './member.service';
import { PersonEditFormComponent } from './person-edit-form.component';

const { App } = Plugins;

@Component({
  selector: 'page-member-detail',
  templateUrl: './member-details-page.html',
  styleUrls: ['./member-details-page.scss'],
  providers: [Navigation],
})
export class MemberDetailsPage implements OnInit, OnDestroy {

  error$: Observable<string>;

  member$: Observable<Member>;
  contracts$: Observable<Contract[]>;
  trialBaskets$: Observable<TrialBasket[]>;

  user: User;
  private subscription: Subscription;

  Kinds = ContractKind;

  constructor(private platform: Platform,
              private navCtrl: NavController,
              private route: ActivatedRoute,
              private nav: Navigation,
              private authService: AuthService,
              private seasonService: SeasonService,
              private memberService: MemberService,
              private contractService: ContractService) {
  }

  ngOnInit() {
    this.member$ = this.route.data.pipe(
      switchMap(data => data.member$ as Observable<Member>),
    );

    this.contracts$ = this.member$.pipe(
      switchMap(m => this.contractService.getContractsForMember$(m)),
      map(cs => cs.sort((c1, c2) => -c1.season.localeCompare(c2.season))),
    );

    this.trialBaskets$ = this.member$.pipe(
      map(m => m.trialBaskets || []),
      map(tbs => tbs.sort((tb1, tb2) => -this.trialBasketCompare(tb1, tb2))),
    );

    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user);
  }

  private trialBasketCompare(tb1, tb2) {
    return (tb1.season + '-' + tb1.week).localeCompare(tb2.season + '-' + tb2.week);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  dismiss() {
    this.navCtrl.goBack();
  }

  canContactPerson() {
    return this.platform.is('android');
  }

  conctactPerson(person: Person, type: 'sms' | 'tel') {
    App.openUrl({ url: type + ':' + person.phoneNumber });
  }

  canEdit() {
    return this.user && this.user.hasRole(Roles.ADMINISTRATOR);
  }

  createPerson() {
    this.nav.showEditDialog$({
      component: PersonEditFormComponent,
      data: {
        title: 'PERSON.CREATION_TITLE',
        person: {},
      },
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyAdd(m.persons, p) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe();
  }

  editPerson(person: Person, index: number) {
    this.nav.showEditDialog$({
      component: PersonEditFormComponent,
      data: {
        title: 'PERSON.EDITION_TITLE',
        person: person,
      },
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyWith(m.persons, index, p) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe();
  }

  deletePerson(person: Person, index: number) {
    this.nav.showAlert$({
      header: 'Confirm Deletion',
      message: `Are you sure you want to delete '${person.firstname} ${person.lastname}' ?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete' },
      ],
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyRemove(m.persons, index) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe();
  }

  createContract() {
    this.seasonService.seasonForDate$().pipe(
      take(1),
      withLatestFrom(
        this.seasonService.lastSeasons$(1).pipe(map(ss => ss[0])),
        this.member$,
        this.contracts$.pipe(map(cs => cs.length === 0 ? null : cs[0])),
        (currentSeason, lastSeason, member, lastContract) => ({
          title: 'CONTRACT.CREATION_TITLE',
          contract: this.inferNewContract(currentSeason, lastSeason, member, lastContract),
        }),
      ),
      switchMap(data => this.nav.showModal$({
        component: ContractsEditPage,
        componentProps: data,
      })),
      filter(r => r.role === 'save'),
      map(r => r.data),
      map(c => {
        const seasonId = c.season.substring('season:'.length);
        const memberId = c.member.substring('member:'.length);
        c._id = `contract:${seasonId}-${memberId}`;
        return c;
      }),
      switchMap(c => this.contractService.putContracts$(c)),
    ).subscribe();
  }

  private inferNewContract(currentSeason: Season, lastSeason: Season,
                           member: Member, lastContract: Contract) {

    // If last contract is the for the current season,
    // then prepare a contract for the last season
    const season =
      lastContract && lastContract.season === currentSeason.id ? lastSeason : currentSeason;

    const seasonId = season.id.substring('season:'.length);
    const memberId = member._id.substring('member:'.length);

    const lastVegetableContract = !lastContract ? null :
      lastContract.sections.find(c => c.kind === ContractKind.VEGETABLES);
    const lastEggContract = !lastContract ? null :
      lastContract.sections.find(c => c.kind === ContractKind.EGGS);

    function inferFirstWeek(maybeContract: ContractSection) {
      if (!maybeContract || ContractService.hasRegularFormula(maybeContract)) {
        return 1;
      } else {
        return maybeContract.firstWeek % 2 === 1 ? 1 : 2;
      }
    }

    return {
      _id: `contract:${seasonId}-${memberId}`,
      type: 'contract',
      srev: 'v1',
      season: `season:${seasonId}`,
      member: `member:${memberId}`,
      sections: [
        {
          kind: ContractKind.VEGETABLES,
          formula: lastVegetableContract ? lastVegetableContract.formula : 1,
          firstWeek: inferFirstWeek(lastVegetableContract),
        },
        {
          kind: ContractKind.EGGS,
          formula: lastEggContract ? lastEggContract.formula : 1,
          firstWeek: inferFirstWeek(lastEggContract),
        },
      ],
      validation: {
        wish: true,
      },
    };
  }

  editContract(contract: Contract, index: number) {
    this.nav.showModal$({
      component: ContractsEditPage, componentProps: {
        title: 'CONTRACT.EDITION_TITLE',
        contract: contract,
      },
    }).pipe(
      filter(r => r.role === 'save'),
      map(r => r.data),
      map(c => Object.assign({}, contract, c)),
      switchMap(c => this.contractService.putContracts$(c)),
    ).subscribe();
  }

  deleteContract(contract: Contract, index: number) {
    this.nav.showAlert$({
        header: 'Confirm Deletion',
        message: `Are you sure you want to delete these contracts ?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete' },
        ],
      })
      .pipe(
        switchMap(() => this.contractService.removeContracts$(contract)),
      )
      .subscribe();
  }

  addTrialBasket() {
    this.seasonService.seasonWeekForDate$().pipe(
      take(1),
      withLatestFrom(
        this.member$,
        (currentWeek, member) => ({
          title: 'TRIAL_BASKET.CREATION_TITLE',
          trialBasket: this.inferNewTrialBasket(currentWeek, member),
        }),
      ),
      switchMap(data => this.nav.showModal$({
        component: TrialBasketEditPage,
        componentProps: data,
      })),
      filter(r => r.role === 'save'),
      map(r => r.data),
      withLatestFrom(this.member$,
        (tb, m) => Object.assign({}, m, { trialBaskets: copyAdd(m.trialBaskets || [], tb) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe();
  }

  private inferNewTrialBasket(currentWeek: SeasonWeek, member: Member) {
    let trialBaskets = !member.trialBaskets ? [] : member.trialBaskets.slice();
    trialBaskets.sort((tb1, tb2) => -this.trialBasketCompare(tb1, tb2));

    let last = trialBaskets.length === 0 ? null : trialBaskets[0];

    const lastVegetableSection = !last ? null :
      last.sections.find(c => c.kind === ContractKind.VEGETABLES);
    const lastEggSection = !last ? null :
      last.sections.find(c => c.kind === ContractKind.EGGS);

    return {
      season: last ? last.season : currentWeek.season.id,
      week: last && last.week >= currentWeek.seasonWeek ? last.week + 1 : currentWeek.seasonWeek,
      paid: false,
      sections: [
        {
          kind: ContractKind.VEGETABLES,
          count: lastVegetableSection ? lastVegetableSection.count : 1,
        },
        {
          kind: ContractKind.EGGS,
          count: lastEggSection ? lastEggSection.count : 0,
        },
      ],
    };
  }

  editTrialBasket(trialBasket: TrialBasket, index: number) {
    of(trialBasket).pipe(
      map(basket => ({
        title: 'TRIAL_BASKET.TITLE',
        trialBasket: basket,
      })),
      switchMap(data => this.nav.showModal$({
        component: TrialBasketEditPage,
        componentProps: data,
      })),
      filter(r => r.role === 'save'),
      map(r => r.data),
      withLatestFrom(this.member$,
        (tb, m) => Object.assign({}, m, { trialBaskets: copyWith(m.trialBaskets, index, tb) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe();
  }

  deleteTrialBasket(trialBasket: TrialBasket, index: number) {
    this.nav.showAlert$({
        header: 'Confirm Deletion',
        message: `Are you sure you want to delete this trial basket ?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete' },
        ],
      })
      .pipe(
        withLatestFrom(this.member$,
          (d, m) => Object.assign({}, m, { trialBaskets: copyRemove(m.trialBaskets, index) }),
        ),
        switchMap(m => this.memberService.putMember$(m)),
      )
      .subscribe();
  }
}
