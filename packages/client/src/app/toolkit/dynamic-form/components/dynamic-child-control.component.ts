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

import { ChildControlConfig, ComponentConfig, FormConfig } from '../models/form-config.interface';
import { DynamicControlComponent } from './dynamic-control.component';

export abstract class DynamicChildControlComponent<C extends ChildControlConfig & ComponentConfig> extends DynamicControlComponent<C> {

  get dynamicControl() {
    return this.group.get(this.config.name);
  }
}
