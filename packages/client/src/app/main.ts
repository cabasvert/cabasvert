import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app.module'
import { LOCALE_ID } from "@angular/core"

require('events').EventEmitter.defaultMaxListeners = 100

let providers = [
  { provide: LOCALE_ID, useValue: navigator.language }
]
platformBrowserDynamic(providers).bootstrapModule(AppModule, { providers: providers })
