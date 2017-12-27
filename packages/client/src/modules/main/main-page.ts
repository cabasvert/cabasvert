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
import { AppVersion } from "@ionic-native/app-version"
import { App, Ion, IonicPage, MenuController, Nav, Platform } from "ionic-angular"
import { Subscription } from "rxjs/Subscription"

import { AuthService, Roles, User } from "../../toolkit/providers/auth-service"

import { DistributionPage } from "../distributions/distribution-page"
import { MembersPage } from "../members/members-page"
import { ProfilePage } from "../profiles/profile-page"
import { ReportsPage } from "../reports/reports-page"
import { LoginPage } from "./login/login-page"
import { WelcomePage } from "./welcome-page"

type PageGroup = {
  title?: string,
  acceptedRoles?: string[],
  pages: PageDescription[],
}

type PageDescription = {
  title: string,
  icon: string,
  acceptedRoles?: string[],
  component: any,
  params?: any,
}

@Component({
  selector: 'page-main',
  templateUrl: './main-page.html',
})
@IonicPage({
  name: 'main',
  segment: 'main'
})
export class MainPage {

  @ViewChild(Nav) nav: Nav

  mainPage: any = WelcomePage

  pageGroups: PageGroup[]

  user: User
  appVersionNumber: string

  private subscription: Subscription

  constructor(private authService: AuthService,
              private app: App,
              private menuCtrl: MenuController,
              private platform: Platform,
              private appVersion: AppVersion) {

    this.platform.registerBackButtonAction(() => {
      let activeRoot = this.app.getRootNavs()[0].getActive().name
      if (activeRoot == 'LoginPage') {
        this.platform.exitApp()
        return
      }

      let activeMain = this.nav.getActive().name
      if (this.nav.canGoBack()) {
        this.nav.pop()
      } else if (activeMain != 'WelcomePage') {
        this.nav.setRoot(WelcomePage)
      } else if (activeMain == 'WelcomePage') {
        this.logout()
      }
    })

    this.platform.ready().then(() =>
      this.appVersion.getVersionNumber().then(versionNumber => {
        this.appVersionNumber = versionNumber
      }).catch(error => {
      })
    )

    this.pageGroups = [
      {
        pages: [
          {
            title: 'SIDEMENU.WELCOME', icon: "home",
            component: WelcomePage,
          },
          {
            title: 'SIDEMENU.PROFILE', icon: "person",
            component: ProfilePage,
          },
        ],
      },
      {
        title: 'SIDEMENU.DISTRIBUTION',
        acceptedRoles: [Roles.DISTRIBUTOR],
        pages: [
          {
            title: 'SIDEMENU.CHECK_DISTRIBUTION', icon: "checkmark",
            component: DistributionPage,
          },
        ],
      },
      {
        title: 'SIDEMENU.ADMINISTRATION',
        acceptedRoles: [Roles.ADMINISTRATOR],
        pages: [
          {
            title: 'SIDEMENU.ADHERENTS', icon: "people",
            component: MembersPage,
          },
          {
            title: 'SIDEMENU.REPORTS', icon: "pie",
            component: ReportsPage,
          },
        ],
      },
    ]
  }

  ionViewWillLoad() {
    this.subscription = this.authService.loggedInUser$.subscribe(user => this.user = user)
  }

  ionViewWillUnload() {
    this.subscription.unsubscribe()
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component, page.params)
  }

  logout() {
    this.authService.logout().then(() => {
      this.menuCtrl.close()
      this.app.getRootNavs()[0].setRoot(LoginPage)
    })
  }
}
