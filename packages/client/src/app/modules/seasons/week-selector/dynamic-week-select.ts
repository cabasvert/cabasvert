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

import { Observable } from 'rxjs';
import {
  ChildControlConfig,
  ComponentConfig, ConfigFn,
} from '../../../toolkit/dynamic-form/models/form-config.interface';
import { Season } from '../season.model';
import { DynamicWeekSelectComponent } from './dynamic-week-select.component';

export function weekSelect(config: WeekSelectConfig): WeekSelectConfig & ComponentConfig {
  return {
    ...config,
    component: DynamicWeekSelectComponent,
  };
}

export interface WeekSelectConfig extends ChildControlConfig {
  season: ConfigFn<Observable<Season>>;
  nullAllowed?: boolean;
}
