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
import { AppState, NetworkStatus, Plugins } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { fromEvent, merge, Observable, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { map, publishReplay, refCount, tap } from 'rxjs/operators';
import { LogService } from './log-service';
import { Logger } from './logger';

const { App, Network } = Plugins;

@Injectable()
export class AppBridge {

  private _logger: Logger;

  private get logger() {
    return this._logger || (this._logger = this.logService.logger('App'));
  }

  private isHybrid = this.platform.is('hybrid');

  public readonly appIsActive$: Observable<boolean>;
  public readonly networkStatus$: Observable<NetworkStatus>;
  public readonly networkIsConnected$: Observable<boolean>;

  constructor(private logService: LogService,
              private platform: Platform) {

    this.appIsActive$ = this.isHybrid ?
      fromEvent(App, 'appStateChange').pipe(
        map((state: AppState) => state.isActive),
        tap(active => this.logger.info(`Went to ${active ? 'foreground' : 'background'}`)),
        publishReplay(1),
        refCount(),
      ) :
      of(true).pipe(
        publishReplay(1),
        refCount(),
      );

    this.networkStatus$ = this.isHybrid ?
      merge(
        fromPromise(Network.getStatus()),
        fromEvent<NetworkStatus>(Network, 'networkStatusChange'),
      ).pipe(
        publishReplay(1),
        refCount(),
      ) :
      of<NetworkStatus>({ connected: true, connectionType: 'wifi' }).pipe(
        publishReplay(1),
        refCount(),
      );

    this.networkIsConnected$ = this.networkStatus$.pipe(
      map((status: NetworkStatus) => status.connected),
      tap(connected => this.logger.info(`Network is ${connected ? 'connected' : 'disconnected'}`)),
      publishReplay(1),
      refCount(),
    );
  }

  get networkStatus(): Promise<NetworkStatus> {
    return this.isHybrid ? Network.getStatus() :
      Promise.resolve<NetworkStatus>({ connected: true, connectionType: 'wifi' });
  }
}
