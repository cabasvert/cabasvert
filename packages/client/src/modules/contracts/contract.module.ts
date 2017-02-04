import { NgModule } from "@angular/core"
import { IonicPageModule } from "ionic-angular"
import { TranslateModule } from "@ngx-translate/core"
import { ReactiveFormsModule } from "@angular/forms"

import { ContractsView } from "./contracts-view"
import { ContractsEditPage } from "./contracts-edit-page"
import { ContractService } from "./contract.service"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ContractsView,
    ContractsEditPage,
  ],
  entryComponents: [
    ContractsEditPage,
  ],
  exports: [
    ContractsView,
    ContractsEditPage,
  ],
  providers: [
    ContractService,
  ],
})
export class ContractModule { }
