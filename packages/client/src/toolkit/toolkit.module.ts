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

import { NgModule, Optional, SkipSelf } from "@angular/core"
import { ReactiveFormsModule } from "@angular/forms"
import { TranslateModule } from "@ngx-translate/core"
import { IonicPageModule } from "ionic-angular"

import { IndexedScroller } from "./components/indexed-scroller"
import { ItemActions } from "./components/item-actions"
import { ItemExpanding } from "./components/item-expanding"
import { SearchbarExpanding } from "./components/searchbar-expanding"
import { SlidingPane } from "./components/sliding-pane"
import { SlidingPanes } from "./components/sliding-panes"
import { SyncStateIndicator } from "./components/sync-state-indicator"
import { ElasticDirective } from "./directives/elastic"
import { LongPressDirective } from "./directives/long-press"
import { ScrollToTopDirective } from "./directives/scroll-to-top"
import { ShowOnMediaDirective } from "./directives/show-on-media"
import { SafeUrlPipe } from "./pipes/safe-url.pipe"

import { AuthService } from "./providers/auth-service"
import { DatabaseHelper } from "./providers/database-helper"
import { DatabaseService } from "./providers/database-service"
import { LogService } from "./providers/log-service"
import { Navigation } from "./providers/navigation"

@NgModule({
  imports: [
    IonicPageModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    // Components
    IndexedScroller,
    ItemActions,
    ItemExpanding,
    SearchbarExpanding,
    SlidingPane,
    SlidingPanes,
    SyncStateIndicator,

    // Directives
    ElasticDirective,
    LongPressDirective,
    ScrollToTopDirective,
    ShowOnMediaDirective,

    // Pipes
    SafeUrlPipe,
  ],
  exports: [
    // Components
    IndexedScroller,
    ItemActions,
    ItemExpanding,
    SearchbarExpanding,
    SlidingPane,
    SlidingPanes,
    SyncStateIndicator,

    // Directives
    ElasticDirective,
    LongPressDirective,
    ScrollToTopDirective,
    ShowOnMediaDirective,

    // Pipes
    SafeUrlPipe,
  ],
  providers: [
    LogService,
    Navigation,
    DatabaseHelper,
    AuthService,
    DatabaseService,
  ]
})
export class ToolkitModule {
  constructor(@Optional() @SkipSelf() parentModule: ToolkitModule) {
    if (parentModule) {
      throw new Error(
        'ToolkitModule is already loaded. Import it in the AppModule only.')
    }
  }
}
