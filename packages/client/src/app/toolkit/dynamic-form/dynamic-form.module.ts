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
import { DynamicArrayComponent } from './components/dynamic-array.component';
import { DynamicCheckboxComponent } from './components/dynamic-checkbox.component';

import { DynamicControlHostDirective } from './components/dynamic-control-host.directive';
import { DynamicControlsComponent } from './components/dynamic-controls.component';
import { DynamicFormComponent } from './components/dynamic-form.component';
import { DynamicGroupComponent } from './components/dynamic-group.component';
import { DynamicHiddenInputComponent } from './components/dynamic-hidden-input.component';
import { DynamicInputComponent } from './components/dynamic-input.component';
import { DynamicSelectComponent } from './components/dynamic-select.component';
import { DynamicTextareaComponent } from './components/dynamic-textarea.component';
import { DynamicFormService } from './dynamic-form.service';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    DynamicControlHostDirective,
    DynamicControlsComponent,
    DynamicFormComponent,
    DynamicArrayComponent,
    DynamicGroupComponent,
    DynamicCheckboxComponent,
    DynamicHiddenInputComponent,
    DynamicInputComponent,
    DynamicSelectComponent,
    DynamicTextareaComponent,
  ],
  exports: [
    DynamicFormComponent,
  ],
  entryComponents: [
    DynamicArrayComponent,
    DynamicGroupComponent,
    DynamicCheckboxComponent,
    DynamicHiddenInputComponent,
    DynamicInputComponent,
    DynamicSelectComponent,
    DynamicTextareaComponent,
  ],
  providers: [
    DynamicFormService,
  ],
})
export class DynamicFormModule {
}
