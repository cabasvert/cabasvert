import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ContractModule } from "../contracts/contract.module"

import { MemberDetailsPage } from "./member-details-page"
import { MemberView } from "./member-view"
import { MemberService } from "./member.service"
import { MembersPage } from "./members-page"
import { PersonEditPage } from "./person-edit-page"
import { ToolkitModule } from "../../toolkit/toolkit.module"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
    ContractModule,
  ],
  declarations: [
    MembersPage,
    MemberDetailsPage,
    MemberView,
    PersonEditPage,
  ],
  entryComponents: [
    MembersPage,
    MemberDetailsPage,
    PersonEditPage,
  ],
  exports: [
    MemberView,
  ],
  providers: [
    MemberService,
  ],
})
export class MemberModule { }
