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
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Member } from './member.model';
import { MemberService } from './member.service';

@Injectable()
export class MemberResolver implements Resolve<Observable<Member>> {

  constructor(private memberService: MemberService,
              private router: Router) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Observable<Member>> {
    let id = route.paramMap.get('id');

    return this.memberService.getMemberById$(id).pipe(
      take(1),
      map(m => {
        if (!m) {
          this.router.navigate(['/members']);
          return null;
        } else {
          return this.memberService.getMemberById$(id);
        }
      }),
    );
  }
}
