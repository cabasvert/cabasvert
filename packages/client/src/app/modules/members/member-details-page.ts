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

import { Component, NgZone, OnDestroy, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Season, SeasonWeek } from '@cabasvert/data'
import { Plugins } from '@capacitor/core'
import { NavController, Platform } from '@ionic/angular'
import { TranslateService } from '@ngx-translate/core'
import { Observable, ReplaySubject, share, Subscription } from 'rxjs'
import { map, switchMap, take, withLatestFrom } from 'rxjs/operators'

import { AuthService, Roles, User } from '../../toolkit/providers/auth-service'
import { Dialogs } from '../../toolkit/dialogs/dialogs.service'
import { copyAdd, copyRemove, copyWith } from '../../utils/arrays'
import { observeInsideAngular } from '../../utils/observables'
import { Contract, ContractKind, ContractSection } from '../contracts/contract.model'
import { ContractService } from '../contracts/contract.service'
import { ContractsEditForm } from '../contracts/contracts-edit-form.component'
import { TrialBasketEditForm } from '../contracts/trial-basket-edit-form.component'
import { SeasonService } from '../seasons/season.service'

import { Member, Person, TrialBasket } from './member.model'
import { MemberService } from './member.service'
import { PersonEditForm } from './person-edit-form.component'

const { App } = Plugins

@Component({
  selector: 'page-member-detail',
  templateUrl: './member-details-page.html',
  styleUrls: ['./member-details-page.scss'],
})
export class MemberDetailsPage implements OnInit, OnDestroy {

  error$: Observable<string>

  member$: Observable<Member>
  contracts$: Observable<Contract[]>
  trialBaskets$: Observable<TrialBasket[]>

  user: User
  private subscription: Subscription

  Kinds = ContractKind

  constructor(private platform: Platform,
              private navCtrl: NavController,
              private route: ActivatedRoute,
              private translateService: TranslateService,
              private dialogs: Dialogs,
              private authService: AuthService,
              private seasonService: SeasonService,
              private memberService: MemberService,
              private contractService: ContractService,
              private ngZone: NgZone) {
  }

  ngOnInit() {
    this.member$ = this.route.data.pipe(
      switchMap(data => data.member$ as Observable<Member>),
    )

    this.contracts$ = this.member$.pipe(
      switchMap(m => this.contractService.contractsByMember$(m)),
      map(cs => cs.sort((c1, c2) => -c1.season.localeCompare(c2.season))),
      observeInsideAngular(this.ngZone),
      share({ connector: () => new ReplaySubject(1) }),
    )

    this.trialBaskets$ = this.member$.pipe(
      map(m => m.trialBaskets || []),
      map(tbs => tbs.sort((tb1, tb2) => -this.trialBasketCompare(tb1, tb2))),
      share({ connector: () => new ReplaySubject(1) }),
    )

    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  private trialBasketCompare(tb1, tb2) {
    return (tb1.season + '-' + tb1.week.toString().padStart(2, '0'))
      .localeCompare(tb2.season + '-' + tb2.week.toString().padStart(2, '0'))
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  dismiss() {
    this.navCtrl.back()
  }

  canContactPerson() {
    return this.platform.is('android')
  }

  conctactPerson(person: Person, type: 'sms' | 'tel') {
    App.openUrl({ url: type + ':' + person.phoneNumber })
  }

  canEdit() {
    return this.user && this.user.hasRole(Roles.ADMINISTRATOR)
  }

  createPerson() {
    this.dialogs.showEditDialog$({
      component: PersonEditForm,
      title: 'PERSON.CREATION_TITLE',
      discardTitle: 'PERSON.DISCARD_CREATION_TITLE',
      discardText: 'PERSON.DISCARD_CREATION_TEXT',
      data: {
        person: {},
      },
      isNewData: true,
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyAdd(m.persons, p) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe()
  }

  editPerson(person: Person, index: number) {
    this.dialogs.showEditDialog$({
      component: PersonEditForm,
      title: 'PERSON.EDITION_TITLE',
      discardTitle: 'PERSON.DISCARD_EDITION_TITLE',
      discardText: 'PERSON.DISCARD_EDITION_TEXT',
      data: {
        person: person,
      },
      isNewData: false,
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyWith(m.persons, index, p) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe()
  }

  deletePerson(person: Person, index: number) {
    this.dialogs.showAlert$({
      header: this.translateService.instant('DIALOGS.CONFIRM_DELETION'),
      message: this.translateService.instant('PERSON.CONFIRM_DELETE_TEXT'),
      buttons: [
        { text: this.translateService.instant('DIALOGS.CANCEL'), role: 'cancel' },
        { text: this.translateService.instant('DIALOGS.DELETE') },
      ],
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyRemove(m.persons, index) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe()
  }

  createContract() {
    this.seasonService.seasonForDate$().pipe(
      take(1),
      withLatestFrom(
        this.seasonService.latestSeason$,
        this.member$,
        this.contracts$.pipe(map(cs => cs.first())),
        this.trialBaskets$.pipe(map(tbs => tbs.first())),
        this.inferNewContract,
      ),
      switchMap(contract => this.dialogs.showEditDialog$({
        component: ContractsEditForm,
        title: 'CONTRACT.CREATION_TITLE',
        discardTitle: 'CONTRACT.DISCARD_CREATION_TITLE',
        discardText: 'CONTRACT.DISCARD_CREATION_TEXT',
        data: { contract },
        isNewData: true,
      })),
      map(c => {
        const seasonId = c.season.substring('season:'.length)
        const memberId = c.member.substring('member:'.length)
        c._id = `contract:${seasonId}-${memberId}`
        return c
      }),
      switchMap(c => this.contractService.putContracts$(c)),
    ).subscribe()
  }

  private inferNewContract(currentSeason: Season, latestSeason: Season,
                           member: Member, latestContract: Contract, latestTrial: TrialBasket) {

    // If latest contract is the contract for the current season,
    // then prepare a contract for the latest season
    const season =
      latestContract && latestContract.season === currentSeason.id ? latestSeason : currentSeason

    const seasonId = season.id.substring('season:'.length)
    const memberId = member._id.substring('member:'.length)

    const latestVegetableContract = !latestContract ? null :
      latestContract.sections.find(c => c.kind === ContractKind.VEGETABLES)
    const latestEggContract = !latestContract ? null :
      latestContract.sections.find(c => c.kind === ContractKind.EGGS)

    const latestVegetableTrial = !latestTrial ? null :
      latestTrial.sections.find(c => c.kind === ContractKind.VEGETABLES)
    const latestEggTrial = !latestTrial ? null :
      latestTrial.sections.find(c => c.kind === ContractKind.EGGS)

    function inferFirstWeek(maybeContract: ContractSection) {
      if (!maybeContract || ContractService.hasRegularFormula(maybeContract)) {
        return 1
      } else {
        return maybeContract.firstWeek % 2 === 1 ? 1 : 2
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
          formula:
            latestVegetableContract ? latestVegetableContract.formula :
              latestVegetableTrial ? latestVegetableTrial.count : 1,
          firstWeek: inferFirstWeek(latestVegetableContract),
        },
        {
          kind: ContractKind.EGGS,
          formula:
            latestEggContract ? latestEggContract.formula :
              latestEggTrial ? latestEggTrial.count : 1,
          firstWeek: inferFirstWeek(latestEggContract),
        },
      ],
      validation: {
        wish: true,
      },
    }
  }

  editContract(contract: Contract, index: number) {
    this.dialogs.showEditDialog$({
      component: ContractsEditForm,
      title: 'CONTRACT.EDITION_TITLE',
      discardTitle: 'CONTRACT.DISCARD_EDITION_TITLE',
      discardText: 'CONTRACT.DISCARD_EDITION_TEXT',
      data: { contract },
      isNewData: false,
    }).pipe(
      map(c => Object.assign({}, contract, c)),
      switchMap(c => this.contractService.putContracts$(c)),
    ).subscribe()
  }

  deleteContract(contract: Contract, index: number) {
    this.dialogs.showAlert$({
        header: this.translateService.instant('DIALOGS.CONFIRM_DELETION'),
        message: this.translateService.instant('CONTRACT.CONFIRM_DELETE_TEXT'),
        buttons: [
          { text: this.translateService.instant('DIALOGS.CANCEL'), role: 'cancel' },
          { text: this.translateService.instant('DIALOGS.DELETE') },
        ],
      })
      .pipe(
        switchMap(() => this.contractService.removeContracts$(contract)),
      )
      .subscribe()
  }

  addTrialBasket() {
    this.seasonService.seasonWeekForDate$().pipe(
      take(1),
      withLatestFrom(
        this.trialBaskets$.pipe(map(tbs => tbs.first())),
        this.inferNewTrialBasket,
      ),
      switchMap(trialBasket => this.dialogs.showEditDialog$({
        component: TrialBasketEditForm,
        title: 'TRIAL_BASKET.CREATION_TITLE',
        discardTitle: 'TRIAL_BASKET.DISCARD_CREATION_TITLE',
        discardText: 'TRIAL_BASKET.DISCARD_CREATION_TEXT',
        data: { trialBasket },
        isNewData: true,
      })),
      withLatestFrom(this.member$,
        (tb, m) => Object.assign({}, m, { trialBaskets: copyAdd(m.trialBaskets || [], tb) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe()
  }

  private inferNewTrialBasket(currentWeek: SeasonWeek, latestTrial: TrialBasket | null) {

    // TODO Use nextWeek() to properly compute next week

    const latestVegetableSection = !latestTrial ? null :
      latestTrial.sections.find(c => c.kind === ContractKind.VEGETABLES)
    const latestEggSection = !latestTrial ? null :
      latestTrial.sections.find(c => c.kind === ContractKind.EGGS)

    return {
      season: latestTrial ? latestTrial.season : currentWeek.season.id,
      week: latestTrial && latestTrial.week >= currentWeek.seasonWeek ?
        latestTrial.week + 1 : currentWeek.seasonWeek,
      paid: false,
      sections: [
        {
          kind: ContractKind.VEGETABLES,
          count: latestVegetableSection ? latestVegetableSection.count : 1,
        },
        {
          kind: ContractKind.EGGS,
          count: latestEggSection ? latestEggSection.count : 0,
        },
      ],
    }
  }

  editTrialBasket(trialBasket: TrialBasket, index: number) {
    this.dialogs.showEditDialog$({
      component: TrialBasketEditForm,
      title: 'TRIAL_BASKET.EDITION_TITLE',
      discardTitle: 'TRIAL_BASKET.DISCARD_EDITION_TITLE',
      discardText: 'TRIAL_BASKET.DISCARD_EDITION_TEXT',
      data: { trialBasket },
      isNewData: false,
    }).pipe(
      withLatestFrom(this.member$,
        (tb, m) => Object.assign({}, m, { trialBaskets: copyWith(m.trialBaskets, index, tb) }),
      ),
      switchMap(m => this.memberService.putMember$(m)),
    ).subscribe()
  }

  deleteTrialBasket(trialBasket: TrialBasket, index: number) {
    this.dialogs.showAlert$({
        header: this.translateService.instant('DIALOGS.CONFIRM_DELETION'),
        message: this.translateService.instant('TRIAL_BASKET.CONFIRM_DELETE_TEXT'),
        buttons: [
          { text: this.translateService.instant('DIALOGS.CANCEL'), role: 'cancel' },
          { text: this.translateService.instant('DIALOGS.DELETE') },
        ],
      })
      .pipe(
        withLatestFrom(this.member$,
          (d, m) => Object.assign({}, m, { trialBaskets: copyRemove(m.trialBaskets, index) }),
        ),
        switchMap(m => this.memberService.putMember$(m)),
      )
      .subscribe()
  }
}
