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

import { launch } from 'puppeteer'
import { baseUrl, sel } from './utils'

describe('App', () => {
  let browser

  beforeAll(async () => {
    browser = await launch()
  })

  afterAll(() => {
    browser.close()
  })

  it('should start', async () => {
    let page = await browser.newPage()
    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(sel('app'))
  })
})
