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
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthGuard } from '../../toolkit/providers/auth-guard';
import { Roles } from '../../toolkit/providers/auth-service';
import { ToolkitModule } from '../../toolkit/toolkit.module';
import { ReportsPage } from '../reports/reports-page';

import { ChangePasswordPage } from './change-password-page';
import { ProfilePage } from './profile-page';

let routes: Routes = [
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
    ToolkitModule,
    RouterModule.forChild(routes),
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
    ProfilePage,
  ],
  providers: [],
})
export class ProfileModule {
}
