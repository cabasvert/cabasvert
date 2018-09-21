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

import { AfterViewInit, Component, NgZone, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { observeInsideAngular } from '../../utils/observables';

import { DatabaseService } from '../providers/database-service';
import { SyncState, SyncStatus } from './sync-state-listener';

@Component({
  selector: 'sync-state',
  template: `
    <ion-button icon-only
                [disabled]="isAlive$ | async"
                (click)="forceRecreateIfNecessary$.next()">
      <ion-icon name="{{ icon$ | async }}"></ion-icon>
    </ion-button>
  `,
})
export class SyncStateIndicator implements OnInit {

  syncState$: Observable<SyncState>;
  forceRecreateIfNecessary$: Subject<void>;

  icon$: Observable<string>;
  isAlive$: Observable<boolean>;

  constructor(private databaseService: DatabaseService,
              private zone: NgZone) {
    this.syncState$ = this.databaseService.syncState$;
    this.forceRecreateIfNecessary$ = this.databaseService.forceRecreateIfNecessary$;
  }

  ngOnInit() {
    this.icon$ = this.syncState$.pipe(
      observeInsideAngular(this.zone),
      map(s => {
        if (!s) {
          return 'cloud-outline';
        }
        switch (s.status) {
          case SyncStatus.ACTIVE:
            return 'cloud';
          case SyncStatus.PUSHING:
            return 'cloud-upload';
          case SyncStatus.PULLING:
            return 'cloud-download';
          case SyncStatus.PAUSED:
            return 'cloud-done';
          case SyncStatus.COMPLETE:
            return 'cloud-outline';
        }
      }),
      startWith('cloud'),
    );

    this.isAlive$ = this.syncState$.pipe(
      observeInsideAngular(this.zone),
      map(s => s && s.status !== SyncStatus.COMPLETE),
    );
  }
}
