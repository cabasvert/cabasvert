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

import { baseUrl } from '../config'

export function sel(id: string) {
  return `[data-testid="${id}"]`
}

export async function clearCookies(page) {
  await page.deleteCookie(...(await page.cookies(baseUrl)))
}

export async function waitForEvent(page, selector, eventName) {
  const eventPromise = new Promise((resolve, reject) =>
    page.on('metrics', ({ title }) => {
      if (eventName === title) {
        resolve()
      }
    }),
  )

  await page.$eval(selector, (el, name) => {
    el.addEventListener(name, (v) => {
      console.timeStamp(name)
    }, { once: true })
  }, eventName)

  return eventPromise
}

export async function waitForEvent2(page, selector, eventName) {
  const eventPromise = new Promise(async (resolve, reject) => {
    await page.exposeFunction('onCustomEvent', () => {
      resolve()
    })
  })

  await page.$eval(selector, (el, name) => {
    el.addEventListener(name, (v) => {
      window['onCustomEvent'](v)
    }, { once: true })
  }, eventName)

  return eventPromise
}
