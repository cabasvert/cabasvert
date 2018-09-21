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

import { Component, Inject, LOCALE_ID, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { Plugins, StatusBarStyle } from '@capacitor/core';
import { AppVersion } from '@ionic-native/app-version/ngx';
import {
  ActionSheetController,
  IonRouterOutlet,
  MenuController,
  ModalController,
  NavController,
  Platform,
  PopoverController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { NodeCompatibleEventEmitter } from 'rxjs/internal/observable/fromEvent';
import { filter, take } from 'rxjs/operators';

import { PageGroup, PAGES } from './menu-page.interface';
import { AuthService, User } from './toolkit/providers/auth-service';

const { SplashScreen, StatusBar, App } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {

  pageGroups: PageGroup[] = PAGES;

  appVersionNumber: string;

  user$: Observable<User>;

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;

  private subscription: Subscription;

  constructor(private platform: Platform,
              private appVersion: AppVersion,
              private translate: TranslateService,
              private authService: AuthService,
              private navCtrl: NavController,
              private popoverCtrl: PopoverController,
              private actionSheetCtrl: ActionSheetController,
              private modalCtrl: ModalController,
              private menuCtrl: MenuController,
              private router: Router,
              private route: ActivatedRoute,
              @Inject(LOCALE_ID) private locale: string) {

    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

    this.initTranslation();

    if (this.platform.is('android') || this.platform.is('ios')) {
      await StatusBar.setStyle({ style: StatusBarStyle.Dark });
      await StatusBar.setBackgroundColor({ color: '#126019' });
    }

    try {
      this.appVersionNumber = await this.appVersion.getVersionNumber();
    } catch (error) {
    }

    // Wait for the initial navigation to succeed before hiding the splash screen
    this.router.events.pipe(
      filter(e => e instanceof Scroll),
      take(1),
    ).subscribe(() => {
      if (this.platform.is('android') || this.platform.is('ios')) {
        SplashScreen.hide();
      }
    });

    // FIXME Hack because backButton is not supported correctly yet
    if (this.platform.is('android')) {
      fromEvent(App as NodeCompatibleEventEmitter, 'backButton').subscribe(async () => {
        try {
          let element = await this.actionSheetCtrl.getTop();
          if (element) {
            this.actionSheetCtrl.dismiss();
            return;
          }
        } catch (error) {
        }

        try {
          let element = await this.popoverCtrl.getTop();
          if (element) {
            this.popoverCtrl.dismiss();
            return;
          }
        } catch (error) {
        }

        try {
          let element = await this.modalCtrl.getTop();
          if (element) {
            this.modalCtrl.dismiss();
            return;
          }
        } catch (error) {
        }

        let canGoBack = this.routerOutlets.find((outlet: IonRouterOutlet) => outlet && outlet.canGoBack());
        if (canGoBack) {
          this.navCtrl.goBack();
          return;
        }

        this.navCtrl.navigateRoot('/dashboard');
      });
    }
  }

  initTranslation() {
    let userLang = this.locale.split('-')[0];

    this.translate.setDefaultLang('fr');
    this.translate.use(userLang);

    this.translate.get('language', null).subscribe(localizedValue =>
      console.log(`Selected language: ${localizedValue}`),
    );
  }

  ngOnInit() {
    this.user$ = this.authService.loggedInUser$;
  }

  async navigateToPage(page) {
    let commands = ['/' + page.path];
    if (page.params) commands.push(page.params);

    this.menuCtrl.close();

    await this.navCtrl.navigateRoot(commands);
  }

  async logout() {
    await this.authService.logout();

    this.menuCtrl.close();

    await this.navCtrl.navigateRoot(['/login']);
  }
}
