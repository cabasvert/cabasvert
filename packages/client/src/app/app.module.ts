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

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { SecureStorage } from '@ionic-native/secure-storage/ngx';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ConfigurationModule } from './config/configuration.module';
import { ConfigurationService } from './config/configuration.service';
import { inferLocale, registerLocales } from './locales';
import { AuthenticationModule } from './modules/authentication/authentication.module';

import { ContractModule } from './modules/contracts/contract.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DistributionModule } from './modules/distributions/distribution.module';
import { MemberModule } from './modules/members/member.module';
import { ProfileModule } from './modules/profiles/profile.module';
import { ReportModule } from './modules/reports/report.module';
import { SeasonModule } from './modules/seasons/season.module';
import { AuthService } from './toolkit/providers/auth-service';
import { DatabaseHelper } from './toolkit/providers/database-helper';

import { DatabaseService } from './toolkit/providers/database-service';
import { networkProvider } from './toolkit/providers/network';
import { ToolkitModule } from './toolkit/toolkit.module';
import { IonicGestureConfig } from './toolkit/utils/gestures';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

registerLocales();

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),

    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: http => new TranslateHttpLoader(http, '../assets/i18n/', '.json'),
        deps: [HttpClient],
      },
    }),

    // Technical Modules
    ConfigurationModule,
    ToolkitModule.forRoot(),

    // Business Modules
    SeasonModule,
    MemberModule,
    ContractModule,
    DistributionModule,
    ProfileModule,
    ReportModule,
    AuthenticationModule,
    DashboardModule,

    // Rooting
    AppRoutingModule,

    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: inferLocale() },

    // Ionic Native
    SecureStorage,
    networkProvider,
    AppVersion,

    { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // App Initializer
    {
      provide: APP_INITIALIZER,
      deps: [ConfigurationService, DatabaseHelper, AuthService, DatabaseService],
      useFactory: initializeApplication,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}

export function initializeApplication(configuration: ConfigurationService,
                                      databaseHelper: DatabaseHelper,
                                      authService: AuthService,
                                      databaseService: DatabaseService) {
  return async () => {
    await configuration.loadConfiguration();
    await databaseHelper.initialize();
    await authService.initialize();
    await databaseService.initialize();
  };
}
