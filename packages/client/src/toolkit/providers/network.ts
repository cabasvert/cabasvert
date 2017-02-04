import { Network } from '@ionic-native/network'
import { Platform } from 'ionic-angular'
import { Observable } from "rxjs/Observable"
import { filter, mapTo } from "rxjs/operators"
import { Subject } from "rxjs/Subject"

export class BrowserNetworkProvider extends Network {

  private online$: Subject<boolean> = new Subject()

  constructor() {
    super()
    let listener = () => this.online$.next(navigator.onLine)
    window.addEventListener('online', listener)
    window.addEventListener('offline', listener)
  }

  public get type(): string {
    return this.isOnline() ? 'wifi' : 'none'
  }

  private isOnline(): boolean {
    return navigator.onLine
  }

  onchange(): Observable<any> {
    return this.online$.pipe(mapTo(null))
  }

  onDisconnect(): Observable<any> {
    return this.online$.pipe(filter(online => !online), mapTo(null))
  }

  onConnect(): Observable<any> {
    return this.online$.pipe(filter(online => online), mapTo(null))
  }
}

export function networkFactory(platform: Platform) {
  return platform.is('cordova') ? new Network() : new BrowserNetworkProvider()
}

export let networkProvider = {
  provide: Network,
  useFactory: networkFactory,
  deps: [Platform],
}
