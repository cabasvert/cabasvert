import { NgModule } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { SeasonService } from "./season.service"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [],
  entryComponents: [],
  exports: [],
  providers: [
    SeasonService,
  ],
})
export class SeasonModule {
}
