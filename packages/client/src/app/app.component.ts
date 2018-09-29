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
import { SwUpdate } from '@angular/service-worker';
import { Plugins, StatusBarStyle } from '@capacitor/core';
import {
  IonRouterOutlet,
  MenuController,
  NavController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { BackButtonEvent, setupConfig } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { interval, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { APP_VERSION } from '../version';

import { PageGroup, PAGES } from './menu-page.interface';
import { AuthService, User } from './toolkit/providers/auth-service';
import { LogService } from './toolkit/providers/log-service';
import { Logger } from './toolkit/providers/logger';

const { SplashScreen, StatusBar } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {

  private _logger: Logger;

  private get log() {
    if (this._logger == null) {
      this._logger = this.logService.logger('App');
    }
    return this._logger;
  }

  pageGroups: PageGroup[] = PAGES;

  appVersionNumber: string;

  user$: Observable<User>;

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;

  constructor(private platform: Platform,
              private translate: TranslateService,
              private swUpdate: SwUpdate,
              private toastCtrl: ToastController,
              private logService: LogService,
              private authService: AuthService,
              private navCtrl: NavController,
              private menuCtrl: MenuController,
              private router: Router,
              private route: ActivatedRoute,
              @Inject(LOCALE_ID) private locale: string) {

    this.initializeApp();
  }

  private async initializeApp() {

    this.initTranslation();

    if (this.swUpdate.isEnabled) {
      // Show the update toast if an update is available
      this.swUpdate.available.subscribe(async () => {
        await this.showUpdateToast();
      });

      // Check every 6 hours whether there is an update
      interval(6 * 60 * 60 * 1000).subscribe(() => this.swUpdate.checkForUpdate());
    }

    if (this.platform.is('android') || this.platform.is('ios')) {
      await StatusBar.setStyle({ style: StatusBarStyle.Dark });
      await StatusBar.setBackgroundColor({ color: '#126019' });
    }

    try {
      this.appVersionNumber = APP_VERSION;
    } catch (error) {
    }

    // Wait for the initial navigation to succeed before hiding the splash screen
    this.router.events.pipe(
      filter(e => e instanceof Scroll),
      take(1),
    ).subscribe(() => {
      if (this.platform.is('android') || this.platform.is('ios')) {
        this.log.debug('Hiding splash screen');
        SplashScreen.hide();
      }
    });

    // Override Ionic's default behavior
    if (this.platform.is('hybrid') ||
      (this.platform.is('desktop') && environment.testHardwareBackButton)) {
      window.document.addEventListener('ionBackButton', (ev) => {
        (ev as BackButtonEvent).detail.register(50, () => this.goBack());
      });
    }
  }

  initTranslation() {
    let userLang = this.locale.split('-')[0];

    this.translate.setDefaultLang('fr');
    this.translate.use(userLang);

    this.translate.get('language', null).subscribe(localizedValue =>
      this.log.info(`Selected language: ${localizedValue}`),
    );
  }

  ngOnInit() {
    this.user$ = this.authService.loggedInUser$;
  }

  private async showUpdateToast() {
    let toast = await this.toastCtrl.create({
      position: 'top',
      message: this.translate.instant('PWA.UPDATE_AVAILABLE'),
      closeButtonText: this.translate.instant('PWA.RELOAD'),
      showCloseButton: true,
      duration: 5000,
    });
    await toast.present();

    let detail = await toast.onDidDismiss();
    if (detail.role === 'cancel') {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    }
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

  private async goBack() {
    let canGoBack = this.routerOutlets.find(outlet => outlet && outlet.canGoBack());
    if (canGoBack) {
      this.navCtrl.goBack();
    } else {
      await this.navCtrl.navigateRoot('/dashboard');
    }
  }
}
