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
import { Network } from '@ionic-native/network/ngx';
import { Platform } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { filter, mapTo } from 'rxjs/operators';

@Injectable()
export class BrowserNetworkProvider extends Network {

  private online$: Subject<boolean> = new Subject();

  constructor() {
    super();
    const listener = () => this.online$.next(navigator.onLine);
    window.addEventListener('online', listener);
    window.addEventListener('offline', listener);
  }

  public get type(): string {
    return this.isOnline() ? 'wifi' : 'none';
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  onchange(): Observable<any> {
    return this.online$.pipe(mapTo(null));
  }

  onDisconnect(): Observable<any> {
    return this.online$.pipe(filter(online => !online), mapTo(null));
  }

  onConnect(): Observable<any> {
    return this.online$.pipe(filter(online => online), mapTo(null));
  }
}

export function networkFactory(platform: Platform) {
  return /*platform.is('cordova') ?*/ new Network() /*: new BrowserNetworkProvider()*/;
}

export let networkProvider = {
  provide: Network,
  useFactory: networkFactory,
  deps: [Platform],
};
