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
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { IndexedScroller } from './components/indexed-scroller';
import { ItemAction } from './components/item-action';
import { ItemActions } from './components/item-actions';
import { ItemExpanding } from './components/item-expanding';
import { ScrollToTop } from './components/scroll-to-top.component';
// import { SearchbarExpanding } from './components/searchbar-expanding';
import { SlidingPane } from './components/sliding-pane';
import { SlidingPanes } from './components/sliding-panes';
import { SyncStateIndicator } from './components/sync-state-indicator';
import { EditDialogComponent } from './dialogs/edit-dialog.component';
import { EditFormHostDirective } from './dialogs/edit-form-host.directive';
import { ElasticDirective } from './directives/elastic';
import { ScrollToTopDirective } from './directives/scroll-to-top';
import { ShowOnMediaDirective } from './directives/show-on-media';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { AuthGuard } from './providers/auth-guard';

import { AuthService } from './providers/auth-service';
import { DatabaseHelper } from './providers/database-helper';
import { DatabaseService } from './providers/database-service';
import { LogService } from './providers/log-service';
import { Navigation } from './providers/navigation';
import { UidService } from './providers/uid-service';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    // Components
    IndexedScroller,
    ItemActions,
    ItemAction,
    ItemExpanding,
    ScrollToTop,
    // SearchbarExpanding,
    SlidingPane,
    SlidingPanes,
    SyncStateIndicator,

    // Directives
    ElasticDirective,
    ShowOnMediaDirective,

    // Dialogs stuff
    EditDialogComponent,
    EditFormHostDirective,

    // Pipes
    SafeUrlPipe,
  ],
  entryComponents: [
    EditDialogComponent,
  ],
  exports: [
    // Components
    IndexedScroller,
    ItemActions,
    ItemAction,
    ItemExpanding,
    ScrollToTop,
    // SearchbarExpanding,
    SlidingPane,
    SlidingPanes,
    SyncStateIndicator,

    // Directives
    ElasticDirective,
    ShowOnMediaDirective,

    // Pipes
    SafeUrlPipe,
  ],
})
export class ToolkitModule {

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: ToolkitModule,
      providers: [
        LogService,
        Navigation,
        DatabaseHelper,
        AuthService,
        AuthGuard,
        DatabaseService,
        UidService,
      ],
    };
  }

  // FIXME !!!
  // constructor(@Optional() @SkipSelf() parentModule: ToolkitModule) {
  //   if (parentModule) {
  //     throw new Error(
  //       'ToolkitModule is already loaded. Import it in the AppModule only.');
  //   }
  // }
}
