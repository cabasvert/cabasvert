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

import { Injectable } from '@angular/core';

import PouchHttp from 'pouchdb-adapter-http';
import PouchIdb from 'pouchdb-adapter-idb';
import PouchAuth from 'pouchdb-authentication';
import PouchDB from 'pouchdb-core';
import PouchFind from 'pouchdb-find';
import PouchSync from 'pouchdb-replication';

import { combineLatest, EMPTY, from, merge, Observable, of } from 'rxjs';
import {
  catchError,
  map,
  mapTo,
  mergeMap,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { ConfigurationService } from '../../config/configuration.service';
import { SyncState, SyncStateListener } from '../components/sync-state-listener';
import { Logger, LogService } from './log-service';

PouchDB
  .plugin(PouchHttp)
  .plugin(PouchIdb)
  .plugin(PouchAuth)
  .plugin(PouchFind)
  .plugin(PouchSync);

@Injectable()
export class DatabaseHelper {

  private _logger: Logger;

  private get log() {
    if (this._logger == null) {
      this._logger = this.logService.logger('Database');
    }
    return this._logger;
  }

  constructor(private logService: LogService,
              private config: ConfigurationService) {
  }

  initialize() {
    window['PouchDB'] = PouchDB;

    if (this.config.base.debugPouch) {
      PouchDB.debug.enable('*');
    } else {
      PouchDB.debug.disable();
    }
  }

  newRemoteDatabase(dbName: string): Database {
    this.log.debug(`Creating remote database '${dbName}'`);
    const pouchOpts = { skip_setup: true };
    const pouchDB = new PouchDB(this.config.base.databaseUrl + '/' + dbName, pouchOpts);
    const maxLimit = this.config.base.remoteDBOnly ? Number.MAX_SAFE_INTEGER : null;
    return new Database(pouchDB, this.log.subLogger('Remote'), maxLimit);
  }

  newLocalDatabase(dbName: string): Database {
    this.log.debug(`Creating local database '${dbName}'`);
    const pouchOpts = {};
    const pouchDB = new PouchDB(dbName, pouchOpts);
    return new Database(pouchDB, this.log.subLogger('Local'));
  }
}

export interface Cancelable {
  cancel(): void;
}

export class Database {

  constructor(private db: PouchDB.Database<{}>, log: Logger, private maxLimit?: number) {
    this.log = log.withPrefix(`(${this._id})`);
    this._syncStateListener = new SyncStateListener();
    this.log.debug(`Created database`);
  }

  get syncState$(): Observable<SyncState> {
    return this._syncStateListener.changes$;
  }

  private static lastId = 0;

  private _id: number = Database.lastId++;
  private log: Logger;

  private cancelables: Cancelable[] = [];
  private sync: PouchDB.Replication.Sync<{}>;
  private _syncStateListener: SyncStateListener;

  private _authenticationCookieTimeout = 600; // In seconds
  private _authenticationCookieRenewal;

  private static stringifyFilterDocs(change: any) {
    return JSON.stringify(change,
      function replacer(key, value) {
        // Filtering out properties
        if (key === 'docs') {
          return value.map(elt => {
            return { _id: elt._id, _rev: elt._rev };
          });
        } else if (key === 'last_seq') {
          return null;
        } else {
          return value;
        }
      }, 2);
  }

  public close(): Promise<void> {
    this.log.debug(`Cancelling remaining cancelables (count: ${this.cancelables.length})`);
    this.cancelables.forEach(c => c.cancel());
    this.cancelAuthenticationCookieRenewer();
    this.log.debug(`Closed database`);
    return Promise.resolve();
  }

  private addCancelable(replication: Cancelable) {
    this.cancelables.push(replication);
    this.log.debug(`Added cancelable (count: ${this.cancelables.length})`);
  }

  private removeCancelable(cancelable: Cancelable) {
    this.cancelables = this.cancelables.filter(c => c !== cancelable);
    this.log.debug(`Removed cancelable (count: ${this.cancelables.length})`);
  }

  public destroy(options?: any) {
    this.close();
    return this.db.destroy(options).catch((e) => {
      if (!e) {
        return Promise.resolve();
      }
      return Promise.reject(new PouchError(e, 'destroy'));
    });
  }

  public signUp(username: string, password: string, options?: PouchDB.Authentication.PutUserOptions) {
    return this.db.signUp(username, password, options).catch((e) => {
      return Promise.reject(new PouchError(e, 'signUp'));
    });
  }

  public login(username: string, password: string, options: {} = {}): Promise<boolean> {
    this.log.debug(`Attempting to log user '${username}' in...`);
    return this.db.logIn(username, password, options || {}).then((r) => {
      if (r.ok) {
        this.log.info(`Successfully logged user '${username}' in.`);
        this.setupAuthenticationCookieRenewer();
      } else {
        this.log.error(`Failed to log user '${username}' in.`);
      }
      return r.ok;
    }).catch((e) => {
      const error = new PouchError(e, 'login');
      this.log.error(`Failed to log user: ${error}`);
      return Promise.reject(error);
    });
  }

  public changePassword(username: string, oldPassword: string, newPassword: string, options: {} = {}): Promise<boolean> {
    return this.db.changePassword(username, newPassword, options || {}).then(r => {
      if (r.ok) {
        this.log.info(`Successfully changed password.`);
      } else {
        this.log.error('Failed to change password.');
      }
      return r.ok;
    }).catch((e) => {
      const error = new PouchError(e, 'changePassword');
      this.log.error(`Failed to change password: ${error}`);
      return Promise.reject(error);
    });
  }

  public getUser(username: string): Promise<any> {
    return this.wrapErrors('getUser', this.db.getUser(username));
  }

  public getSession(): Promise<any> {
    return this.wrapErrors('getSession', this.db.getSession());
  }

  public logout(): Promise<boolean> {
    this.cancelAuthenticationCookieRenewer();
    return this.wrapErrors('logout', this.db.logOut()).then((r) => {
      if (r.ok) {
        this.log.info(`Successfully logged user out.`);
      } else {
        this.log.error(`Failed to log user out.`);
      }
      return r.ok;
    }).catch(error => {

      // The logout call always fail on Firefox, so we disable the error.
      // (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’)
      // despite that OPTIONS is indeed listed in the CORS configuration.

      this.log.error(`Logout [error] ${error}`);
    });
  }

  setupAuthenticationCookieRenewer() {
    this._authenticationCookieRenewal = setInterval(() => {
      this.getSession().then(res => {
        if (res.ok && res.userCtx.name) {
          this.log.info(`Authentication correctly cookie renewed`);
        } else {
          this.log.error(`Failed to renew authentication cookie: ${JSON.stringify(res)}`);
        }
      }).catch(error => {
        this.log.error(`Failed to renew authentication cookie: ${JSON.stringify(error)}`);
      });
    }, this._authenticationCookieTimeout * 1000 / 2);
  }

  cancelAuthenticationCookieRenewer() {
    if (this._authenticationCookieRenewal) {
      clearInterval(this._authenticationCookieRenewal);
    }
  }

  public doSync(other: Database, options?: {}): void {
    this.log.info(`Setup sync with database (${other._id}): ${JSON.stringify(options)}`);
    this.sync = this.db.sync(other.db, options);

    this.addCancelable(this.sync);

    this.sync.on('change', change => {
      this.log.debug(`Sync with remote [change] ${Database.stringifyFilterDocs(change)}`);
    }).on('paused', error => {
      this.log.debug(`Sync with remote [paused] ${error ? new PouchError(error) : ''}`);
    }).on('denied', error => {
      this.log.error(`Sync with remote [denied] ${error ? new PouchError(error) : ''}`);
    }).on('error', error => {
      this.log.error(`Sync with remote [error] ${error ? new PouchError(error) : ''}`);
      this.removeCancelable(this.sync);
      this.sync = null;
    }).on('active', () => {
      this.log.debug(`Sync with remote [active]`);
    }).on('complete', info => {
      this.log.debug(`Sync with remote [complete] ${JSON.stringify(info, null, 2)}`);
      this.removeCancelable(this.sync);
      this.sync = null;
    });

    this._syncStateListener.listenToSync(this.sync);
  }

  public doCancelSync(): void {
    if (this.sync) {
      this.log.info(`Cancelling sync`);
      this.sync.cancel();
    }
  }

  public changes(options?: {}) {
    const changes = this.db.changes(options);

    this.addCancelable(changes);

    changes.on('complete', info => {
      this.removeCancelable(changes);
    }).on('error', error => {
      this.removeCancelable(changes);
    });

    return changes;
  }

  public withIndex(index: any): Promise<Database> {
    return this.wrapErrors('createIndex', this.db.createIndex(index).then(() => this));
  }

  public find(query: any): Promise<PouchDB.Find.FindResponse<any>> {
    if (this.maxLimit && !query.limit) {
      query.limit = this.maxLimit;
    }
    return this.wrapErrors('find', this.db.find(query).then(result => {
      const warning = result['warning'];
      if (warning) {
        this.log.warn(`Warning message "${warning}" while processing find: ${JSON.stringify(query)}`);
      }
      return result;
    }));
  }

  public get(docId: string) {
    return this.wrapErrors('get', this.db.get(docId));
  }

  public put(doc: any): Promise<PouchDB.Core.Response> {
    this.log.info('Put doc: ' + JSON.stringify({ _id: doc._id, _rev: doc._rev }));
    return this._doPut(doc);
  }

  public remove(doc: any): Promise<PouchDB.Core.Response> {
    this.log.info('Remove doc: ' + JSON.stringify({ _id: doc._id, _rev: doc._rev }));
    doc._deleted = true;
    return this._doPut(doc);
  }

  private _doPut(doc: any) {
    return this.wrapErrors('put', this.db.put(doc));
  }

  private wrapErrors(methodName: string, promise) {
    return promise.catch((e) => {
      return Promise.reject(e instanceof Error ? e : new PouchError(e, methodName));
    });
  }

  /* Reactive methods */

  public findOne$<T>(query: any,
                     mapper: (doc: any) => T = d => d,
                     defaultValue: () => T = () => null): Observable<T> {
    // TODO Not sure it is the correct way to handle sort's presence...
    if (query.sort) {
      throw new Error('Sort not supported here !');
    }
    if (!query.limit || query.limit !== 1) {
      query['limit'] = 1;
    }

    const found$ = this.doFind$(query).pipe(
      map(result => !result.docs || result.docs.length !== 1 ? defaultValue() : mapper(result.docs[0])),
      catchError(_ => EMPTY),
    );

    const changes$ = this.dbChanges$({
      since: 'now', live: true, include_docs: true,
      filter: '_selector',
      selector: query.selector,
    }).pipe(
      map(change => change.deleted ? null : mapper(change.doc)),
    );

    return merge(found$, changes$).pipe(
      publishReplay(1),
      refCount(),
    );
  }

  public findAll$<T>(query: any,
                     mapper: (doc: any) => T = d => d,
                     indexer: (t: T) => string = t => (t as any)._id
  ): Observable<T[]> {
    return this._doFindAll$(
      query,
      mapper,
      docs => docs,
      (docs, id, doc, deleted) => {
        const docIndex = docs.findIndex(d => indexer(d) === id);
        if (deleted) {
          if (docIndex !== -1) {
            docs.splice(docIndex, 1);
          }
        } else {
          if (docIndex !== -1) {
            docs[docIndex] = doc;
          } else {
            docs.push(doc);
          }
        }
        return docs;
      },
    );
  }

  public findAllIndexed$<T>(query: any,
                            mapper: (doc: any) => T = d => d,
                            indexer: (t: T) => string = t => (t as any)._id
  ): Observable<Map<string, T>> {
    return this._doFindAll$(
      query,
      mapper,
      docs => docs.indexedAsMap(indexer),
      (dsi, id, doc, deleted) => {
        if (deleted) dsi.delete(id);
        else dsi.set(id, doc);
        return dsi;
      },
    );
  }

  private _doFindAll$<T>(query: any,
                         mapper: (doc: any) => any,
                         builder: (docs: any[]) => T,
                         merger: (t: T, id: string, doc: any, deleted: boolean) => T,
  ): Observable<T> {
    const found$ = this.doFind$(query).pipe(
      mergeMap(result => !result.docs ? EMPTY : of(result.docs)),
      map(docs => builder(docs.map(mapper))),
      catchError(() => EMPTY),
    );

    const changes$ = this.dbChanges$({
      since: 'now', live: true, include_docs: true,
      filter: '_selector',
      selector: query.selector,
    });

    return combineLatest(
      found$.pipe(catchError(() => of(builder([])))),
      changes$.pipe(startWith(null)),
    ).pipe(
      map(([docs, change]) =>
        change == null ? docs : merger(docs, change.id, mapper(change.doc), change.deleted),
      ),
      publishReplay(1),
      refCount(),
    );
  }

  private doFind$(query: any) {
    return from(this.find(query));
  }

  public put$<T>(doc: T & { _id: string }): Observable<T> {
    return from(this.put(doc)).pipe(
      switchMap(() => this.get(doc._id)),
    );
  }

  public remove$<T>(doc: T & { _id: string }): Observable<void> {
    return from(this.remove(doc)).pipe(
      mapTo(null),
    );
  }

  public get$(id$: Observable<string>) {
    const doc$ = id$.pipe(
      switchMap(id => from(this.get(id))),
      publishReplay(1),
      refCount(),
    );

    return this.withChanges$(doc$);
  }

  public withChanges$(doc$: Observable<any>) {
    const changes$ = doc$.pipe(
      map(d => ({
        since: 'now', live: true, include_docs: true,
        doc_ids: [d._id],
      })),
      switchMap(o => this.dbChanges$(o)),
      map(c => c.doc),
    );

    return merge(doc$, changes$).pipe(
      publishReplay(1),
      refCount(),
    );
  }

  private dbChanges$(options?: {}): Observable<Change> {
    return Observable.create(observer => {
      const changes = this.changes(options)
        .on('change', change => {
          observer.next(change);
        })
        .on('complete', info => {
          if (info.results) {
            info.results.forEach(change => {
              observer.next(change);
            });
          }
          observer.complete();
        })
        .on('error', error => {
          observer.error(error);
        });

      return () => {
        if (changes) {
          changes.cancel();
        }
      };
    });
  }
}

interface Change {
  id: string;
  doc?: any;
  deleted?: boolean;
  seq: number;
}

export class PouchError extends Error {

  public status: number;
  public name: string;

  public constructor(opts: any, methodName: string = null) {
    super(
      (methodName ? `While calling ${methodName}(): ` : '')
      + `[${opts.status}] ${opts.reason}`,
    );
    this.status = opts.status;
    this.name = opts.error;
  }
}
