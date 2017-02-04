import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ToolkitModule } from "../../../toolkit/toolkit.module"

import { ResetPasswordPage } from "./reset-password-page"

@NgModule({
  imports: [
    IonicPageModule.forChild(ResetPasswordPage),
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
  ],
  declarations: [
    ResetPasswordPage,
  ],
  entryComponents: [
    ResetPasswordPage,
  ],
  exports: [
  ],
  providers: [
  ],
})
export class ResetPasswordPageModule { }
