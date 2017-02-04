import { registerLocaleData } from '@angular/common'

import localeEnGb from '@angular/common/locales/en-GB'
import localeEs from '@angular/common/locales/es'
import localeEnGb_Extra from '@angular/common/locales/extra/en-GB'
import localeEs_Extra from '@angular/common/locales/extra/es'
import localeFr_Extra from '@angular/common/locales/extra/fr'
import localeFr from '@angular/common/locales/fr'

export function registerLocales() {
  registerLocaleData(localeEs, localeEs_Extra)
  registerLocaleData(localeFr, localeFr_Extra)
  registerLocaleData(localeEnGb, localeEnGb_Extra)
}
