/*
 * This file is part of CabasVert.
 *
 * Copyright 2017, 2018 Didier Villevalois
 *
 * CabasVert is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * CabasVert is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CabasVert.  If not, see <http://www.gnu.org/licenses/>.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { SeasonService } from './season.service';
import { WeekSelectorComponent } from './week-selector/week-selector.component';
import { WeekSelectControl } from './week-selector/week-select-control.component';
import { WeekViewComponent } from './week-view/week-view.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    WeekSelectorComponent,
    WeekSelectControl,
    WeekViewComponent,
  ],
  entryComponents: [
    WeekSelectorComponent,
  ],
  exports: [
    WeekSelectorComponent,
    WeekSelectControl,
    WeekViewComponent,
  ],
  providers: [
    SeasonService,
  ],
})
export class SeasonModule {
}
