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

import { Component } from "@angular/core"
import { NavParams, ViewController } from "ionic-angular"
import { Observable } from "rxjs/Observable"
import {
  map,
  publishReplay,
  refCount,
  scan,
  startWith,
  switchMap,
  take,
  withLatestFrom,
} from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { Subscription } from "rxjs/Subscription"

import { AuthService, Roles, User } from "../../toolkit/providers/auth-service"
import { Navigation } from "../../toolkit/providers/navigation"
import { copyAdd, copyRemove, copyWith } from "../../utils/arrays"
import { filterNotNull } from "../../utils/observables"
import { Contract, ContractKind, ContractSection } from "../contracts/contract.model"
import { ContractService } from "../contracts/contract.service"
import { ContractsEditPage } from "../contracts/contracts-edit-page"
import { TrialBasketEditPage } from "../distributions/trial-basket-edit-page"
import { Season } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

import { Member, Person } from "./member.model"
import { MemberService } from "./member.service"
import { PersonEditPage } from "./person-edit-page"

@Component({
  selector: 'page-member-detail',
  templateUrl: './member-details-page.html',
  providers: [Navigation],
})
export class MemberDetailsPage {

  error$: Observable<string>

  member$: Observable<Member>
  contracts$: Observable<Contract[]>

  editModeClicks$ = new Subject<void>()
  editMode$: Observable<boolean>

  user: User
  private subscription: Subscription

  Kinds = ContractKind

  constructor(public navParams: NavParams,
              public nav: Navigation,
              public viewCtrl: ViewController,
              public authService: AuthService,
              public seasons: SeasonService,
              public members: MemberService,
              public contracts: ContractService) {
  }

  ionViewDidLoad() {
    if (this.navParams.data) {
      this.member$ = this.navParams.data.member$.pipe(filterNotNull())
    }

    this.editMode$ = this.editModeClicks$.pipe(
      scan((t, _: void) => !t, false),
      startWith(false),
      publishReplay(1),
      refCount(),
    )

    this.contracts$ = this.member$.pipe(
      switchMap(m => this.contracts.getContracts$(m)),
      map(cs => cs.sort((c1, c2) => -c1.season.localeCompare(c2.season))),
    )

    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  canEdit() {
    return this.user && this.user.hasRole(Roles.ADMINISTRATOR)
  }

  createPerson() {
    let data = {
      title: 'PERSON.CREATION_TITLE',
      person: {}
    }
    this.nav.push(PersonEditPage, data).pipe(
      filterNotNull(),
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyAdd(m.persons, p) }),
      ),
      switchMap(m => this.members.putMember$(m)),
    ).subscribe()
  }

  editPerson(person: Person, index: number) {
    let data = {
      title: 'PERSON.EDITION_TITLE',
      person: person
    }
    this.nav.push(PersonEditPage, data).pipe(
      filterNotNull(),
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyWith(m.persons, index, p) })
      ),
      switchMap(m => this.members.putMember$(m)),
    ).subscribe()
  }

  deletePerson(person: Person, index: number) {
    this.nav.alert({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete '${person.firstname} ${person.lastname}' ?`,
      buttons: [
        { text: "Cancel", role: 'cancel' },
        { text: "Delete" }
      ]
    }).pipe(
      withLatestFrom(this.member$,
        (p, m) => Object.assign({}, m, { persons: copyRemove(m.persons, index) })
      ),
      switchMap(m => this.members.putMember$(m)),
    ).subscribe()
  }

  createContract() {
    this.seasons.seasonForDate$().pipe(
      // take(1),
      withLatestFrom(
        this.seasons.lastSeasons$(1).pipe(map(ss => ss[0])),
        this.member$,
        this.contracts$.pipe(map(cs => cs.length == 0 ? null : cs[0])),
        (currentSeason, lastSeason, member, lastContract) => ({
          contract: this.inferNewContract(currentSeason, lastSeason, member, lastContract),
        }),
      ),
      switchMap(data => this.nav.push(ContractsEditPage, data)),
      filterNotNull(),
      map(c => {
        let seasonId = c.season.substring('season:'.length)
        let memberId = c.member.substring('member:'.length)
        c._id = `contract:${seasonId}-${memberId}`
        return c
      }),
      switchMap(c => this.contracts.putContracts$(c)),
    ).subscribe()
  }

  private inferNewContract(currentSeason: Season, lastSeason: Season,
                           member: Member, lastContract: Contract) {

    // If last contract is the for the current season,
    // then prepare a contract for the last season
    let season =
      lastContract && lastContract.season == currentSeason.id ? lastSeason : currentSeason

    let seasonId = season.id.substring('season:'.length)
    let memberId = member._id.substring('member:'.length)

    let lastVegetableContract = !lastContract ? null :
      lastContract.sections.find(c => c.kind == ContractKind.VEGETABLES)
    let lastEggContract = !lastContract ? null :
      lastContract.sections.find(c => c.kind == ContractKind.EGGS)

    function inferFirstWeek(maybeContract: ContractSection) {
      if (!maybeContract || ContractService.hasRegularFormula(maybeContract)) return 1
      else return maybeContract.firstWeek % 2 == 1 ? 1 : 2
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
    }
  }

  editContract(contract: Contract, index: number) {
    this.nav.push(ContractsEditPage, { contract: contract }).pipe(
      filterNotNull(),
      map(c => Object.assign({}, contract, c)),
      switchMap(c => this.contracts.putContracts$(c)),
    ).subscribe()
  }

  deleteContract(contract: Contract, index: number) {
    this.nav.alert({
        title: "Confirm Deletion",
        message: `Are you sure you want to delete these contracts ?`,
        buttons: [
          { text: "Cancel", role: 'cancel' },
          { text: "Delete" },
        ],
      })
      .pipe(
        switchMap(() => this.contracts.removeContracts$(contract))
      )
      .subscribe()
  }

  addTrialBasket() {
    this.seasons.seasonWeekForDate$().pipe(
      withLatestFrom(
        this.member$,
        (w, m) => {
          return {
            title: 'TRIAL_BASKET.CREATION_TITLE',
            edit: true,
            person: m.persons[0],
            trialBasket: {
              season: w.season.id,
              week: w.seasonWeek,
              paid: false,
              sections: [
                {
                  kind: "legumes",
                  count: 1
                },
                {
                  kind: "oeufs",
                  count: 1
                }
              ]
            }
          }
        }),
      switchMap(data => this.nav.push(TrialBasketEditPage, data)),
      filterNotNull(),
      withLatestFrom(this.member$,
        (d, m) => Object.assign({}, m, { trialBaskets: copyAdd(m.trialBaskets || [], d.trialBasket) })
      ),
      switchMap(m => this.members.putMember$(m)),
    ).subscribe()
  }
}
