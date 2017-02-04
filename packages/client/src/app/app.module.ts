import { HttpClient, HttpClientModule } from "@angular/common/http"
import { APP_INITIALIZER, ErrorHandler, NgModule } from "@angular/core"
import { BrowserModule } from "@angular/platform-browser"
import { AppVersion } from "@ionic-native/app-version"
import { Deeplinks } from "@ionic-native/deeplinks"
import { File } from '@ionic-native/file'
import { FileOpener } from "@ionic-native/file-opener"
import { SecureStorage } from "@ionic-native/secure-storage"
import { SplashScreen } from "@ionic-native/splash-screen"
import { StatusBar } from "@ionic-native/status-bar"
import { TranslateLoader, TranslateModule } from "@ngx-translate/core"
import { TranslateHttpLoader } from "@ngx-translate/http-loader"
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular"

import { ConfigurationModule } from "../config/configuration.module"

import { ContractModule } from "../modules/contracts/contract.module"
import { DistributionModule } from "../modules/distributions/distribution.module"
import { LoginPage } from "../modules/main/login/login-page"
import { MainPage } from "../modules/main/main-page"
import { MainModule } from "../modules/main/main.module"
import { ResetPasswordPage } from "../modules/main/reset-password/reset-password-page"
import { MemberModule } from "../modules/members/member.module"
import { ProfileModule } from "../modules/profiles/profile.module"
import { ReportModule } from "../modules/reports/report.module"
import { SeasonModule } from "../modules/seasons/season.module"

import { DatabaseService } from "../toolkit/providers/database-service"
import { networkProvider } from "../toolkit/providers/network"
import { ToolkitModule } from "../toolkit/toolkit.module"

import { MyApp } from "./app.component"
import { registerLocales } from "./locales"

registerLocales()

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    IonicModule.forRoot(MyApp, {}, {
      links: [
        { component: LoginPage, name: 'login', segment: 'login' },
        { component: ResetPasswordPage, name: 'reset-password', segment: 'reset-password/:username/:token' },
        { component: MainPage, name: 'main', segment: 'main' },
      ],
    }),
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: http => new TranslateHttpLoader(http, "./assets/i18n/", ".json"),
        deps: [HttpClient],
      },
    }),

    // Technical Modules
    ConfigurationModule,
    ToolkitModule,

    // Business Modules
    SeasonModule,
    MemberModule,
    ContractModule,
    DistributionModule,
    ProfileModule,
    ReportModule,
    MainModule,
  ],
  exports: [BrowserModule, HttpClientModule, TranslateModule],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
  ],
  providers: [

    // Ionic/Cordova
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    StatusBar,
    Deeplinks,
    SplashScreen,
    SecureStorage,
    File,
    FileOpener,
    networkProvider,
    AppVersion,

    // App Initializer
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => null,
      deps: [DatabaseService],
      multi: true,
    },
  ],
})
export class AppModule {
}
