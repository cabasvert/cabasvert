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
import { baseUrl, sel, waitForEvent } from './utils'

describe('User', () => {
  let browser
  let page

  const testUser = {
    email: 'distrib@test.com',
    password: 'test',
  }

  beforeAll(async () => {
    browser = await launch({ headless: true })
  })

  afterAll(() => {
    browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  it('cannot go to dashboard if not logged in', async () => {
    await page.goto(`${baseUrl}/dashboard`)

    await page.waitForSelector(sel('login-form'))
  })

  it('can log in', async () => {
    await page.goto(`${baseUrl}/`)

    await page.waitForSelector(sel('login-form'))

    await page.click(sel('email-input'))
    await page.keyboard.type(testUser.email)

    await page.click(sel('password-input'))
    await page.keyboard.type(testUser.password)

    await page.click(sel('login-button'))

    await page.waitForSelector(sel('dashboard'))
  })

  it('goes directly to dashboard if logged in', async () => {
    await page.goto(`${baseUrl}/dashboard`)

    await page.waitForSelector(sel('dashboard'))
  })

  it.skip('can change password', async () => {
    // TODO
  })

  it('can log out', async () => {
    await page.goto(`${baseUrl}/`)

    await page.waitForSelector(sel('dashboard'))

    const menuDidOpen = waitForEvent(page, 'ion-menu', 'ionDidOpen')
    await page.click(sel('menu-button'))
    await menuDidOpen

    await page.waitForSelector(sel('logout-button'), { visible: true })
    await page.click(sel('logout-button'))

    await page.waitForSelector(sel('login-form'))
  })

  it.skip('can reset password', async () => {
    // TODO
    // Find how to mock mail in order to retrieve reset password token
  })

  it.skip('can login while offline', async () => {
    // TODO
  })
})
