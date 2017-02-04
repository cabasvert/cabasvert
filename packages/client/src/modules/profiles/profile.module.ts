import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ChangePasswordPage } from "./change-password-page"
import { ProfilePage } from "./profile-page"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ProfilePage,
    ChangePasswordPage,
  ],
  entryComponents: [
    ProfilePage,
    ChangePasswordPage,
  ],
  exports: [
  ],
  providers: [
  ],
})
export class ProfileModule { }
