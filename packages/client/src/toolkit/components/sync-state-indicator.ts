import { Component, NgZone } from "@angular/core"
import { Observable } from "rxjs/Observable"
import { map, startWith } from "rxjs/operators"
import { Subject } from "rxjs/Subject"
import { observeInsideAngular } from "../../utils/observables"

import { DatabaseService } from "../providers/database-service"
import { SyncState, SyncStatus } from "./sync-state-listener"

@Component({
  selector: 'sync-state',
  template: `
    <button ion-button icon-only
            [disabled]="isAlive$ | async"
            (click)="forceRecreateIfNecessary$.next()">
      <ion-icon name="{{ icon$ | async }}"></ion-icon>
    </button>
  `
})
export class SyncStateIndicator {

  syncState$: Observable<SyncState>
  forceRecreateIfNecessary$: Subject<void>

  icon$: Observable<string>
  isAlive$: Observable<boolean>

  constructor(private databaseService: DatabaseService,
              private zone: NgZone) {
    this.syncState$ = this.databaseService.syncState$
    this.forceRecreateIfNecessary$ = this.databaseService.forceRecreateIfNecessary$
  }

  ngAfterViewInit() {
    this.icon$ = this.syncState$.pipe(
      observeInsideAngular(this.zone),
      map(s => {
        if (!s) return 'cloud-outline'
        switch (s.status) {
          case SyncStatus.ACTIVE:
            return 'cloud'
          case SyncStatus.PUSHING:
            return 'cloud-upload'
          case SyncStatus.PULLING:
            return 'cloud-download'
          case SyncStatus.PAUSED:
            return 'cloud-done'
          case SyncStatus.COMPLETE:
            return 'cloud-outline'
        }
      }),
      startWith('cloud'),
    )

    this.isAlive$ = this.syncState$.pipe(
      observeInsideAngular(this.zone),
      map(s => s && s.status != SyncStatus.COMPLETE),
    )
  }
}
