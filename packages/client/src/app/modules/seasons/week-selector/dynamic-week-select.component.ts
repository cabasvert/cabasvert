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

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { publishReplay, refCount } from 'rxjs/operators';
import { DynamicChildControlComponent } from '../../../toolkit/dynamic-form/components/dynamic-child-control.component';
import { ComponentConfig } from '../../../toolkit/dynamic-form/models/form-config.interface';
import { Forms } from '../../utils/forms';
import { Season } from '../season.model';
import { WeekSelectConfig } from './dynamic-week-select';

@Component({
  selector: 'dynamic-week-select',
  template: `
    <dynamic-item [formGroup]="group.control" [label]="config.label" [problems]="problems">
      <app-week-select [formControlName]="config.name"
                       [season$]="season$"
                       [nullAllowed]="config.nullAllowed">
      </app-week-select>
    </dynamic-item>
  `,
})
export class DynamicWeekSelectComponent extends DynamicChildControlComponent<WeekSelectConfig & ComponentConfig> implements OnInit {

  season$: Observable<Season>;

  ngOnInit() {
    this.season$ = this.applyConfigFn(this.config.season).pipe(
      publishReplay(1),
      refCount(),
    );
  }
}
