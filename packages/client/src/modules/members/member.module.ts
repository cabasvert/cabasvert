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
