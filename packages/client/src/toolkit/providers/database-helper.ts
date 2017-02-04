import { Inject, Injectable } from "@angular/core"

import PouchHttp from 'pouchdb-adapter-http'
import PouchIdb from 'pouchdb-adapter-idb'
import PouchAuth from 'pouchdb-authentication'
import PouchDB from 'pouchdb-core'
import PouchFind from 'pouchdb-find'
import PouchSync from 'pouchdb-replication'

import { Observable } from "rxjs/Observable"
import { empty } from "rxjs/observable/empty"
import { fromPromise } from "rxjs/observable/fromPromise"
import { merge } from "rxjs/observable/merge"
import { of } from "rxjs/observable/of"
import {
  catchError,
  combineLatest,
  filter,
  map,
  mergeMap,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
} from "rxjs/operators"

import { Config } from "../../config/configuration.token"
import { SyncState, SyncStateListener } from "../components/sync-state-listener"
import { Logger, LogService } from './log-service'

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchIdb)
  .plugin(PouchAuth)
  .plugin(PouchFind)
  .plugin(PouchSync)

@Injectable()
export class DatabaseHelper {

  private log = this.logService.logger('Database')

  constructor(private logService: LogService,
              @Inject(Config) private config) {
    window['PouchDB'] = PouchDB

    if (this.config.debugPouch) PouchDB.debug.enable('*')
    else PouchDB.debug.disable()
  }

  newRemoteDatabase(dbName: string): Database {
    this.log.debug(`Creating remote database '${dbName}'`)
    let pouchOpts = { skip_setup: true }
    let pouchDB = new PouchDB(this.config.databaseUrl + '/' + dbName, pouchOpts)
    let maxLimit = this.config.remoteDBOnly ? Number.MAX_SAFE_INTEGER : null
    return new Database(pouchDB, this.log.subLogger('Remote'), maxLimit)
  }

  newLocalDatabase(dbName: string): Database {
    this.log.debug(`Creating local database '${dbName}'`)
    let pouchOpts = {}
    let pouchDB = new PouchDB(dbName, pouchOpts)
    return new Database(pouchDB, this.log.subLogger('Local'))
  }
}

export type Cancelable = { cancel(): void }

export class Database {

  private static lastId = 0

  private _id: number = Database.lastId++
  private log: Logger

  private cancelables: Cancelable[] = []
  private sync: PouchDB.Replication.Sync<{}>
  private _syncStateListener: SyncStateListener

  constructor(private db: any, log: Logger, private maxLimit?: number) {
    this.log = log.withPrefix(`(${this._id})`)
    this._syncStateListener = new SyncStateListener()
    this.log.debug(`Created database`)
  }

  public close(): Promise<void> {
    this.log.debug(`Cancelling remaining cancelables (count: ${this.cancelables.length})`)
    this.cancelables.forEach(c => c.cancel())
    this.cancelAuthenticationCookieRenewer()
    this.log.debug(`Closed database`)
    return Promise.resolve()
  }

  private addCancelable(replication: Cancelable) {
    this.cancelables.push(replication)
    this.log.debug(`Added cancelable (count: ${this.cancelables.length})`)
  }

  private removeCancelable(cancelable: Cancelable) {
    this.cancelables = this.cancelables.filter(c => c != cancelable)
    this.log.debug(`Removed cancelable (count: ${this.cancelables.length})`)
  }

  public destroy(options?: any) {
    this.close()
    return this.db.destroy(options).catch((e) => {
      if (!e) return Promise.resolve()
      return Promise.reject(new PouchError(e, "destroy"))
    })
  }

  public signUp(username: string, password: string, options?: any) {
    return this.db.signup(username, password, options).catch((e) => {
      return Promise.reject(new PouchError(e, "signUp"))
    })
  }

  public login(username: string, password: string, options: {} = {}): Promise<boolean> {
    this.log.debug(`Attempting to log user '${username}' in...`)
    return Promise.resolve().then(() => {
      options = options || {}
      this.addAjaxHeaders(options, username, password)
      return this.db.login(username, password, options).then((r) => {
        if (r.ok) {
          this.log.info(`Successfully logged user '${username}' in.`)
          this.setupAuthenticationCookieRenewer()
        }
        else this.log.error(`Failed to log user '${username}' in.`)
        return r.ok
      }).catch((e) => {
        let error = new PouchError(e, "login")
        this.log.error(`Failed to log user: ${error}`)
        return Promise.reject(error)
      })
    })
  }

  public changePassword(username: string, oldPassword: string, newPassword: string, options: {} = {}): Promise<boolean> {
    return Promise.resolve().then(() => {
      options = options || {}
      this.addAjaxHeaders(options, username, oldPassword)
      return this.db.changePassword(username, newPassword, options).then(r => {
        if (r.ok) this.log.info(`Successfully changed password.`)
        else this.log.error("Failed to change password.")
        return r.ok
      }).catch((e) => {
        let error = new PouchError(e, "changePassword")
        this.log.error(`Failed to change password: ${error}`)
        return Promise.reject(error)
      })
    })
  }

  private addAjaxHeaders(options: {}, username: string, password: string) {
    options['ajax'] = {
      headers: {
        Authorization: 'Basic ' + window.btoa(username + ':' + password),
      },
      body: {
        name: username,
        password: password,
      },
    }
  }

  public getUser(username: string): Promise<any> {
    return this.wrapErrors("getUser", this.db.getUser(username))
  }

  public getSession(): Promise<any> {
    return this.wrapErrors("getSession", this.db.getSession())
  }

  public logout(): Promise<boolean> {
    this.cancelAuthenticationCookieRenewer()
    return this.wrapErrors("logout", this.db.logout()).then((r) => {
      if (r.ok) this.log.info(`Successfully logged user out.`)
      else this.log.error(`Failed to log user out.`)
      return r.ok
    }).catch(error => {

      // The logout call always fail on Firefox, so we disable the error.
      // (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’)
      // despite that OPTIONS is indeed listed in the CORS configuration.

      this.log.error(`Logout [error] ${error}`)
    })
  }

  private _authenticationCookieTimeout = 600 // In seconds
  private _authenticationCookieRenewal: number

  setupAuthenticationCookieRenewer() {
    this._authenticationCookieRenewal = setInterval(() => {
      this.getSession().then(res => {
        if (res.ok && res.userCtx.name)
          this.log.info(`Authentication correctly cookie renewed`)
        else this.log.error(`Failed to renew authentication cookie: ${JSON.stringify(res)}`)
      }).catch(error => {
        this.log.error(`Failed to renew authentication cookie: ${JSON.stringify(error)}`)
      })
    }, this._authenticationCookieTimeout * 1000 / 2)
  }

  cancelAuthenticationCookieRenewer() {
    if (this._authenticationCookieRenewal) clearInterval(this._authenticationCookieRenewal)
  }

  public doSync(other: Database, options?: {}): void {
    this.log.info(`Setup sync with database (${other._id}): ${JSON.stringify(options)}`)
    this.sync = this.db.sync(other.db, options)

    this.addCancelable(this.sync)

    this.sync.on('change', change => {
      this.log.debug(`Sync with remote [change] ${Database.stringifyFilterDocs(change)}`)
    }).on('paused', error => {
      this.log.debug(`Sync with remote [paused] ${error ? new PouchError(error) : ''}`)
    }).on('denied', error => {
      this.log.error(`Sync with remote [denied] ${error ? new PouchError(error) : ''}`)
    }).on('error', error => {
      this.log.error(`Sync with remote [error] ${error ? new PouchError(error) : ''}`)
      this.removeCancelable(this.sync)
      this.sync = null
    }).on('active', () => {
      this.log.debug(`Sync with remote [active]`)
    }).on('complete', info => {
      this.log.debug(`Sync with remote [complete] ${JSON.stringify(info, null, 2)}`)
      this.removeCancelable(this.sync)
      this.sync = null
    })

    this._syncStateListener.listenToSync(this.sync)
  }

  public doCancelSync(): void {
    if (this.sync) {
      this.log.info(`Cancelling sync`)
      this.sync.cancel()
    }
  }

  get syncState$(): Observable<SyncState> {
    return this._syncStateListener.changes$
  }

  private static stringifyFilterDocs(change: any) {
    return JSON.stringify(change,
      function replacer(key, value) {
        // Filtering out properties
        if (key === 'docs') return value.map(elt => {
          return { _id: elt._id, _rev: elt._rev }
        })
        else if (key === 'last_seq') return null
        else return value
      }, 2)
  }

  public changes(options?: {}) {
    let changes = this.db.changes(options)

    this.addCancelable(changes)

    changes.on('complete', info => {
      this.removeCancelable(changes)
    }).on('error', error => {
      this.removeCancelable(changes)
    })

    return changes
  }

  public withIndex(index: any): Promise<Database> {
    return this.wrapErrors("createIndex", this.db.createIndex(index).then(() => this))
  }

  public find(query: any): Promise<PouchDB.Find.FindResponse<any>> {
    if (this.maxLimit && !query.limit) query.limit = this.maxLimit
    return this.wrapErrors("find", this.db.find(query).then(result => {
      if (result.warning) {
        this.log.warn(`Warning message "${result.warning}" while processing find: ${JSON.stringify(query)}`)
      }
      return result
    }))
  }

  public get(docId: string) {
    return this.wrapErrors("get", this.db.get(docId))
  }

  public put(doc: any): Promise<PouchDB.Core.Response> {
    this.log.info('Put doc: ' + JSON.stringify({ _id: doc._id, _rev: doc._rev }))
    return this.wrapErrors("put", this.db.put(doc))
  }

  private wrapErrors(methodName: string, promise) {
    return promise.catch((e) => {
      return Promise.reject(e instanceof Error ? e : new PouchError(e, methodName))
    })
  }

  /* Reactive methods */

  public findOne$(query: any,
                  defaultValue: () => any = () => null): Observable<any> {
    // TODO Not sure it is the correct way to handle sort's presence...
    if (query.sort) throw new Error("Sort not supported here !")
    if (!query.limit || query.limit != 1) query['limit'] = 1

    let found$ = this.doFind$(query).pipe(
      map(result => !result.docs || result.docs.length != 1 ? defaultValue() : result.docs[0]),
      catchError(_ => empty<any>()),
    )

    let changes$ = this.dbChanges$({
      since: 'now', live: true, include_docs: true,
      filter: '_selector',
      selector: query.selector
    }).pipe(
      map(c => c.deleted ? null : c.doc),
    )

    return merge(found$, changes$).pipe(publishReplay(1), refCount())
  }

  public findAll$(query: any): Observable<any[]> {
    let found$ = this.doFind$(query).pipe(
      mergeMap(result => !result.docs ? empty<any[]>() : of(result.docs)),
      catchError(_ => empty<any[]>()),
    )

    let changes$ = this.dbChanges$({
      since: 'now', live: true, include_docs: true,
      filter: '_selector',
      selector: query.selector
    })
    let removals$ = this.dbRemovals$({
      since: 'now', live: true, include_docs: true
    })

    return found$.pipe(
      catchError(_ => of([])),
      combineLatest(changes$.pipe(startWith(null)), (docs, change) => {
        if (change == null) return docs

        let docIndex = docs.findIndex(d => d._id == change.id)
        if (change.deleted) {
          if (docIndex != -1) {
            docs.splice(docIndex, 1)
          }
        } else {
          if (docIndex != -1) {
            docs[docIndex] = change.doc
          } else {
            docs.push(change.doc)
          }
        }

        return docs
      }),
      combineLatest(removals$.pipe(startWith(null)), (docs, change) => {
        if (change == null) return docs

        let docIndex = docs.findIndex(d => d._id == change.id)
        if (docIndex != -1) {
          docs.splice(docIndex, 1)
        }
        return docs
      }),
      publishReplay(1),
      refCount(),
    )
  }

  private doFind$(query: any) {
    return fromPromise(this.find(query))
  }

  public put$(doc: any): Observable<string> {
    // TODO We mutate the original doc...
    return fromPromise(this.put(doc)).pipe(
      map(response => response.rev),
      tap(rev => doc._rev = rev),
    )
  }

  public get$(id$: Observable<string>) {
    let doc$ = id$.pipe(
      switchMap(id => fromPromise(this.get(id))),
      publishReplay(1),
      refCount(),
    )

    return this.withChanges$(doc$)
  }

  public withChanges$(doc$: Observable<any>) {
    let changes$ = doc$.pipe(
      map(d => ({
        since: 'now', live: true, include_docs: true,
        doc_ids: [d._id],
      })),
      switchMap(o => this.dbChanges$(o)),
      map(c => c.doc),
    )

    return merge(doc$, changes$).pipe(publishReplay(1), refCount())
  }

  private dbChanges$(options?: {}): Observable<Change> {
    return Observable.create(observer => {
      let changes = this.changes(options)
        .on('change', change => {
          observer.next(change)
        })
        .on('completed', info => {
          info.results.forEach(change => {
            observer.next(change)
          })
          observer.complete()
        })
        .on('error', error => {
          observer.error(error)
        })

      return () => {
        if (changes) {
          changes.cancel()
        }
      }
    })
  }

  private dbRemovals$(options?: {}): Observable<Change> {
    return this.dbChanges$(options).pipe(filter(c => c.deleted))
  }
}

type Change = {
  id: string,
  doc?: any,
  deleted ?: boolean
  seq: number
}

export class PouchError extends Error {

  public status: number
  public name: string

  public constructor(opts: any, methodName: string = null) {
    super(
      (methodName ? `While calling ${methodName}(): ` : "")
      + `[${opts.status}] ${opts.reason}`
    )
    this.status = opts.status
    this.name = opts.error
  }
}
