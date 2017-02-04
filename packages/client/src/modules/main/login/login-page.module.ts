import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ToolkitModule } from "../../../toolkit/toolkit.module"

import { LoginPage } from "./login-page"

@NgModule({
  imports: [
    IonicPageModule.forChild(LoginPage),
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
  ],
  declarations: [
    LoginPage,
  ],
  entryComponents: [
    LoginPage,
  ],
  exports: [],
  providers: [],
})
export class LoginPageModule {
}
