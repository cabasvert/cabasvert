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

import { Injectable } from '@angular/core'
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
} from '@angular/router'
import { QueryParamsHandling } from '@angular/router/src/config'
import { Observable, of } from 'rxjs'
import { fromPromise } from 'rxjs/internal-compatibility'
import { map, switchMap, take, tap } from 'rxjs/operators'
import { AuthService } from './auth-service'
import { LogService } from './log-service'
import { Logger } from './logger'

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  private _logger: Logger

  private get log() {
    if (this._logger == null) {
      this._logger = this.logService.logger('Auth')
    }
    return this._logger
  }

  constructor(private authService: AuthService,
              private logService: LogService,
              private router: Router) {
  }

  private checkAuthorization(data: any | null, target: string): Observable<boolean> {
    const roles = data && data.roles
    return this.authService.loggedInUser$.pipe(
      take(1),
      switchMap(user =>
        user ? of(user) : fromPromise(this.authService.tryRestoreSessionOrLoadCredentialsAndLogin()).pipe(
          switchMap(granted => granted ? this.authService.loggedInUser$ : of(null)),
          take(1),
        ),
      ),
      map(user => {
        const authenticated = !!user
        const granted = authenticated && (!roles || user.hasAnyRoleIn(roles))

        this.log.info('Checking authorization ' +
          `(user: ${user && user.username || '<none>'}, accepted roles: ${JSON.stringify(roles || [])}, granted: ${granted})`)

        return [authenticated, granted]
      }),
      tap(([authenticated, granted]) => {
        if (target && (target.startsWith('/reset-password/') || target === '/login')) {
          this.router.navigate([target])
          return
        }

        if (!authenticated) this.router.navigate(['/login'], { queryParamsHandling: 'preserve' })
        else if (!granted) this.router.navigate(['/'])
        else if (target) this.router.navigate([target])
      }),
      map(([authenticated, granted]) => granted),
    )
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuthorization(route.data, route.queryParamMap.get('target'))
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.checkAuthorization(childRoute.data, childRoute.queryParamMap.get('target'))
  }

  canLoad(route: Route): Observable<boolean> {
    return this.checkAuthorization(route.data, null)
  }
}
