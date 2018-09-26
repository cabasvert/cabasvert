/**
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

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { setupConfig } from '@ionic/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

require('events').EventEmitter.defaultMaxListeners = 100;

if (environment.production) {
  enableProdMode();
}

// For testing purposes
if (environment.testHardwareBackButton) {
  // FIXME Use npm link until @ionic/core@4.0.0-beta.12 is out
  setupConfig({ hardwareBackButton: true });
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
