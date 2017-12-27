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

import { Component } from '@angular/core'

import { NavController } from 'ionic-angular'
import { Observable } from "rxjs/Observable"
import { Subscription } from "rxjs/Subscription"

import { AuthService, Roles, User } from "../../toolkit/providers/auth-service"
import { errors, ignoreErrors } from "../../utils/observables"

import { ContractKind } from "../contracts/contract.model"
import { DistributionPage } from '../distributions/distribution-page'
import { BasketSectionTotals } from "../distributions/distribution.model"
import { DistributionService } from '../distributions/distribution.service'
import { SeasonWeek } from "../seasons/season.model"
import { SeasonService } from "../seasons/season.service"

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome-page.html',
})
export class WelcomePage {

  Kinds = ContractKind

  week$: Observable<SeasonWeek>
  totals$: Observable<{ [kind: string]: BasketSectionTotals }>

  error$: Observable<string>

  user: User
  private subscription: Subscription

  constructor(public navCtrl: NavController,
              public seasons: SeasonService,
              public distributions: DistributionService,
              public authService: AuthService) {
  }

  ionViewDidLoad() {
    let seasonWeek$ = this.seasons.todaysSeasonWeek$
    this.week$ = seasonWeek$.pipe(ignoreErrors())
    this.error$ = seasonWeek$.pipe(errors())

    this.totals$ = this.distributions.todaysTotals$

    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  isDistributor(): boolean {
    return this.user && this.user.hasRole(Roles.DISTRIBUTOR)
  }

  openDistributionPage() {
    this.navCtrl.setRoot(DistributionPage)
  }
}
