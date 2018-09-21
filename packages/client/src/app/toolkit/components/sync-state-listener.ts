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

import { Observable, ReplaySubject, Subject } from 'rxjs';
import Sync = PouchDB.Replication.Sync;

export enum SyncStatus {
  ACTIVE,
  PUSHING,
  PULLING,
  PAUSED,
  COMPLETE,
}

export interface SyncState {
  status: SyncStatus;
  error?: any;
}

export class SyncStateListener {

  private _subject: Subject<SyncState> = new ReplaySubject(1);
  private _syncState: SyncState;
  private _currentHandler: SyncEventsHandler;

  constructor() {
    this.setState(null, SyncStatus.COMPLETE);
  }

  public listenToSync(sync: Sync<{}>) {
    this._currentHandler = new SyncEventsHandler(this);
    this._currentHandler.setup(sync);
  }

  get changes$(): Observable<SyncState> {
    return this._subject;
  }

  setState(handler: SyncEventsHandler, status: SyncStatus, error ?: any) {
    if (handler !== this._currentHandler) return;

    this._syncState = { status: status, error: error };
    this._subject.next(this._syncState);
  }
}

class SyncEventsHandler {

  constructor(private listener: SyncStateListener) {
  }

  setup(sync: PouchDB.Replication.Sync<{}>) {
    this.handle(SyncStatus.ACTIVE);

    sync.on('change', change => {
      this.handle(change.direction === 'pull' ? SyncStatus.PULLING : SyncStatus.PUSHING);
    }).on('paused', error => {
      this.handle(SyncStatus.PAUSED, error);
    }).on('denied', error => {
      this.handle(SyncStatus.ACTIVE, error);
    }).on('error', error => {
      this.handle(SyncStatus.COMPLETE, error);
    }).on('active', () => {
      this.handle(SyncStatus.ACTIVE);
    }).on('complete', info => {
      this.handle(SyncStatus.COMPLETE);
    });
  }

  private handle(status: SyncStatus, error ?: any) {
    this.listener.setState(this, status, error);
  }
}
