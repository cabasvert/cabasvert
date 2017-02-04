import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { ReportService } from "./report.service"
import { ReportsPage } from "./reports-page"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ReportsPage,
  ],
  entryComponents: [
    ReportsPage,
  ],
  exports: [
  ],
  providers: [
    ReportService,
  ],
})
export class ReportModule { }
