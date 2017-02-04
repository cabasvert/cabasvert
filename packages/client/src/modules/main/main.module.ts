import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ToolkitModule } from "../../toolkit/toolkit.module"
import { LoginPageModule } from "./login/login-page.module"
import { MainPage } from "./main-page"
import { ResetPasswordPageModule } from "./reset-password/reset-password-page.module"
import { WelcomePage } from "./welcome-page"

@NgModule({
  imports: [
    IonicPageModule.forChild(MainPage),
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
    LoginPageModule,
    ResetPasswordPageModule,
  ],
  declarations: [
    MainPage,
    WelcomePage,
  ],
  entryComponents: [
    MainPage,
    WelcomePage,
  ],
  exports: [],
  providers: [],
})
export class MainModule {
}
