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

import { OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { DynamicGroup } from '../dynamic-form.service';
import { ControlConfigBase } from '../models/form-config.interface';

export abstract class DynamicControlComponent<C extends ControlConfigBase> implements OnInit, OnDestroy {
  protected config: C;
  protected group: DynamicGroup;
  protected form: DynamicGroup;
  protected parentDisabled$?: Observable<boolean>;

  private _subscription: Subscription;

  initialize(config: C,
             group: DynamicGroup,
             form: DynamicGroup,
             parentDisabled$: Observable<boolean> = null) {
    this.config = config;
    this.group = group;
    this.form = form;
    this.parentDisabled$ = parentDisabled$;
  }

  abstract get control()

  get changes() {
    return this.control.valueChanges;
  }

  get valid() {
    return this.control.valid;
  }

  get value() {
    return this.control.value;
  }

  patchValue(value: any) {
    this.control.patchValue(value);
  }

  get problems() {
    let control = this.control;
    return control.invalid && control.errors ? control.errors : null;
  }

  get disabled$(): Observable<boolean> {
    let disabled$ = this.immediateDisabled$;

    if (this.parentDisabled$) {
      if (disabled$) {
        disabled$ = combineLatest(disabled$, this.parentDisabled$).pipe(
          map(([b1, b2]) => b1 || b2),
        );
      } else {
        disabled$ = this.parentDisabled$;
      }
    }

    return disabled$;
  }

  private get immediateDisabled$(): Observable<boolean> {
    let disabled = this.config.disabled;
    if (!disabled) return null;

    if (disabled instanceof Function) disabled = disabled(this.form, this.group);

    if (disabled instanceof Observable) return disabled;
    else return of(disabled);
  }

  ngOnInit() {
    let disabled$ = this.disabled$;

    if (disabled$) {
      let control = this.control;

      this._subscription = disabled$.subscribe(disabled => {
        const method = disabled ? 'disable' : 'enable';
        control[method]();
      });
    }
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe();
  }
}
