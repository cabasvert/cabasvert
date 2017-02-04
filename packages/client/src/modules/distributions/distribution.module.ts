import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ToolkitModule } from "../../toolkit/toolkit.module"
import { MemberModule } from "../members/member.module"

import { DistributionPage} from "./distribution-page"
import { DistributionService } from "./distribution.service"
import { TrialBasketEditPage } from "./trial-basket-edit-page"
import { NotePopup } from "./note-popup"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
    MemberModule,
  ],
  declarations: [
    DistributionPage,
    TrialBasketEditPage,
    NotePopup,
  ],
  entryComponents: [
    DistributionPage,
    TrialBasketEditPage,
    NotePopup,
  ],
  exports: [
  ],
  providers: [
    DistributionService,
  ],
})
export class DistributionModule { }
