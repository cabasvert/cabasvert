import './theme/theme-base'

import i18n from 'i18next'

import React from 'react'
import { render } from 'react-dom'
import { initReactI18next } from 'react-i18next'

import { App } from './App'

import translationEN from './assets/i18n/en.json'
import translationFR from './assets/i18n/fr.json'

function initTranslations() {
  return i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: translationEN,
        fr: translationFR,
      },
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    })
}

initTranslations().then(() => {
  render(<App/>, document.getElementById('root'))
})
