import { Observable } from "rxjs/Observable"
import { ReplaySubject } from "rxjs/ReplaySubject"
import { Subject } from "rxjs/Subject"
import Sync = PouchDB.Replication.Sync

export enum SyncStatus {
  ACTIVE,
  PUSHING,
  PULLING,
  PAUSED,
  COMPLETE,
}

export interface SyncState {
  status: SyncStatus
  error?: any
}

export class SyncStateListener {

  private _subject: Subject<SyncState> = new ReplaySubject(1)
  private _syncState: SyncState
  private _currentHandler: SyncEventsHandler

  constructor() {
    this.setState(null, SyncStatus.COMPLETE)
  }

  public listenToSync(sync: Sync<{}>) {
    this._currentHandler = new SyncEventsHandler(this)
    this._currentHandler.setup(sync)
  }

  get changes$(): Observable<SyncState> {
    return this._subject
  }

  setState(handler: SyncEventsHandler, status: SyncStatus, error ?: any) {
    if (handler != this._currentHandler) return

    this._syncState = { status: status, error: error }
    this._subject.next(this._syncState)
  }
}

class SyncEventsHandler {

  constructor(private listener: SyncStateListener) {
  }

  setup(sync: PouchDB.Replication.Sync<{}>) {
    this.handle(SyncStatus.ACTIVE)

    sync.on('change', change => {
      this.handle(change.direction == 'pull' ? SyncStatus.PULLING : SyncStatus.PUSHING)
    }).on('paused', error => {
      this.handle(SyncStatus.PAUSED, error)
    }).on('denied', error => {
      this.handle(SyncStatus.ACTIVE, error)
    }).on('error', error => {
      this.handle(SyncStatus.COMPLETE, error)
    }).on('active', () => {
      this.handle(SyncStatus.ACTIVE)
    }).on('complete', info => {
      this.handle(SyncStatus.COMPLETE)
    })
  }

  private handle(status: SyncStatus, error ?: any) {
    this.listener.setState(this, status, error)
  }
}
