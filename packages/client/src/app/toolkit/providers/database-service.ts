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

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import PouchDB from 'pouchdb-core';

import {
  BehaviorSubject,
  combineLatest,
  defer,
  EMPTY,
  from,
  Observable,
  of,
  Subject,
  Subscription,
  throwError,
} from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  map,
  publishReplay,
  refCount,
  retryWhen,
  switchAll,
  switchMap,
  switchMapTo,
  take,
  withLatestFrom,
} from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ConfigurationService } from '../../config/configuration.service';

import {
  debugObservable,
  filterNotNull,
  observeOutsideAngular,
  previous,
} from '../../utils/observables';
import { SyncState } from '../components/sync-state-listener';
import { AppBridge } from './app-bridge';
import { AuthService } from './auth-service';
import { Database, DatabaseHelper } from './database-helper';

@Injectable()
export class DatabaseService implements OnDestroy {

  constructor(private config: ConfigurationService,
              private appBridge: AppBridge,
              private dbHelper: DatabaseHelper,
              private authService: AuthService,
              private ngZone: NgZone) {
  }

  private get database$(): Observable<Database> {
    return this._database$.pipe(
      filterNotNull(),
      observeOutsideAngular(this.ngZone),
    );
  }

  get syncState$(): Observable<SyncState | null> {
    return this._syncState$;
  }

  forceReset$ = new BehaviorSubject<void>(null);

  private _database$: Observable<Database | null>;
  private _syncState$: Observable<SyncState | null>;

  private _subscription: Subscription = new Subscription();

  private static closeDatabase$(db: Database): Observable<never> {
    return from(db.close()).pipe(
      switchMapTo(EMPTY),
    );
  }

  private static setupSync(localDatabase: Database, remoteDatabase: Database) {
    localDatabase.doSync(remoteDatabase, {
      live: true,
      retry: true,
      continuous: true,
      push: {
        filter: function (doc) {
          return !doc._id.startsWith('_design/');
        },
      },
    });
  }

  private static cancelSync(localDB: Database) {
    localDB.doCancelSync();
  }

  initialize() {
    const loggedInUser$ = this.authService.loggedInUser$;
    const loggedIn$ = loggedInUser$.pipe(map(user => !!user));

    const active$ = this.appBridge.appIsActive$;
    const connected$ = this.appBridge.networkIsConnected$;

    const localDb$: Observable<Database> = loggedIn$.pipe(
      withLatestFrom(loggedInUser$, (loggedIn, user) => {
        if (!loggedIn) {
          return of(null);
        }

        // Add a suffix for development local database to avoid conflicts with production
        let dbName = user.database || 'cabasvert';
        dbName = `${dbName}-${user.username}` + (environment.production ? '' : '-dev');
        return this.createLocalDatabase$(dbName);
      }),
      switchAll(),
      publishReplay(1),
      refCount(),
    );

    this._subscription.add(
      localDb$.pipe(
        previous(),
        filterNotNull(),
        switchMap(db => DatabaseService.closeDatabase$(db)),
      ).subscribe(),
    );

    const remoteDbNeeded$ = combineLatest(active$, loggedIn$, connected$, this.forceReset$).pipe(
      map(([active, loggedIn, connected]) =>
        active && loggedIn && connected
      ),
      distinctUntilChanged(),
    );
    const remoteDb$: Observable<Database> = remoteDbNeeded$.pipe(
      withLatestFrom(loggedInUser$, (needed, user) => {
        if (!needed) {
          return of(null);
        }

        const dbName = user.database || 'cabasvert';
        const creation = this.createRemoteDatabase$(dbName);

        // Make multiple attempts to login to remote database
        // in case the network is not yet fully operable
        return creation.pipe(
          switchMap(db =>
            defer(() => this.loginDatabase$(db)).pipe(
              retryWhen(errors => errors.pipe(delay(500), take(10))),
            ),
          ),
        );
      }),
      switchAll(),
      publishReplay(1),
      refCount(),
    );

    this._subscription.add(
      remoteDb$.pipe(
        previous(),
        filterNotNull(),
        // Do not try to logout database as cookie is shared
        switchMap(db => DatabaseService.closeDatabase$(db)),
      ).subscribe(),
    );

    const maintainSync$ = combineLatest(localDb$, remoteDb$).pipe(
      map(([localDB, remoteDB]) => {
        if (localDB) {
          DatabaseService.cancelSync(localDB);
        }
        if (localDB && remoteDB) {
          DatabaseService.setupSync(localDB, remoteDB);
        }
      }),
    );
    this._subscription.add(
      maintainSync$.subscribe(),
    );

    this._database$ = this.config.base.remoteDBOnly ? remoteDb$ : localDb$;
    this._syncState$ = this._database$.pipe(
      switchMap(d => d ? d.syncState$ : of(null)),
    );
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  private createLocalDatabase$(dbName: string): Observable<Database> {
    return defer(() =>
      from(
        this.maybeWipeLocalDB(dbName).then(() =>
          this.dbHelper.newLocalDatabase(dbName),
        ),
      ),
    );
  }

  private maybeWipeLocalDB(dbName: string): Promise<void> {
    if (this.config.base.wipeLocalDB) {
      const tempDB = this.dbHelper.newLocalDatabase(dbName);
      console.log('For debugging purposes, wiping local database !');
      return tempDB.destroy();
    } else {
      return Promise.resolve();
    }
  }

  private createRemoteDatabase$(dbName: string): Observable<Database> {
    return defer(() =>
      of(this.dbHelper.newRemoteDatabase(dbName)),
    );
  }

  private loginDatabase$(db: Database): Observable<Database> {
    return from(this.authService.loginDatabase(db)).pipe(
      switchMap(ok => ok ? of(db) : throwError('Can\'t login database')),
    );
  }

  private logoutDatabase$(db: Database): Observable<never> {
    return from(this.authService.logoutDatabase(db)).pipe(
      switchMapTo(EMPTY),
    );
  }

  createIndex(index: PouchDB.Find.CreateIndexOptions): Subscription {
    if (this.config.base.remoteDBOnly) {
      return new Subscription();
    }
    return this.database$.pipe(switchMap(db => from(db.withIndex(index)))).subscribe();
  }

  findOne$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper: (doc: any) => T = d => d,
    defaultValue: () => T = () => null,
  ): Observable<T> {

    return this.ngZone.runOutsideAngular(
      () => this.database$.pipe(
        switchMap(db => db.findOne$(query, mapper, defaultValue)),
        publishReplay(1),
        refCount(),
      ),
    );
  }

  findAll$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper: (doc: any) => T = d => d,
    indexer: (t: T) => string = t => (t as any)._id,
  ): Observable<T[]> {

    return this.ngZone.runOutsideAngular(
      () => this.database$.pipe(
        switchMap(db => db.findAll$(query, mapper, indexer)),
        publishReplay(1),
        refCount(),
      ),
    );
  }

  findAllIndexed$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper: (doc: any) => T = d => d,
    indexer: (t: T) => string = t => (t as any)._id,
  ): Observable<Map<string, T>> {

    return this.ngZone.runOutsideAngular(
      () => this.database$.pipe(
        switchMap(db => db.findAllIndexed$(query, mapper, indexer)),
        publishReplay(1),
        refCount(),
      ),
    );
  }

  public put$<T>(doc: T & { _id: string }): Observable<T> {
    return this.database$.pipe(switchMap(db => db.put$(doc)));
  }

  public remove$<T>(doc: T & { _id: string }): Observable<void> {
    return this.database$.pipe(switchMap(db => db.remove$(doc)));
  }

  public get$<T>(id: string): Observable<T> {
    return this.database$.pipe(
      switchMap(db => db.get$(id)),
      publishReplay(1),
      refCount(),
    );
  }
}
