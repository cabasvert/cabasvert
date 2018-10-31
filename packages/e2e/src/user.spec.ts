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
import { baseUrl } from './config'
import { MockSMTPServer } from './utils/mock-smtp-server'
import { sel, waitForEvent } from './utils/puppeteer'

describe('User', () => {
  let mockSMTPServer: MockSMTPServer

  let browser
  let page

  const testUser = {
    email: 'distrib@test.com',
    password: 'test',
  }

  beforeAll(async () => {
    mockSMTPServer = new MockSMTPServer()

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

    mockSMTPServer.clearMessages()
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
    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(sel('dashboard'))
  })

  it('can change password', async () => {
    await page.goto(`${baseUrl}/profile`)
    await page.waitForSelector(sel('profile-page'))

    await page.click(sel('change-password-button'))
    await page.waitForSelector('ion-modal')
    await waitForEvent(page, 'ion-modal', 'ionModalDidPresent')
    await page.waitForSelector(sel('change-password-page'))

    await page.click(sel('oldPassword-input'))
    await page.keyboard.type(testUser.password)

    await page.click(sel('newPassword-input'))
    await page.keyboard.type(testUser.password)

    await page.click(sel('confirmedPassword-input'))
    await page.keyboard.type(testUser.password)

    await page.click(`${sel('change-password-page')} ${sel('change-password-button')}`)
    await page.waitForSelector(sel('profile-page'))

    await page.waitForSelector('ion-toast')
    await waitForEvent(page, 'ion-toast', 'ionToastDidPresent')
  })

  it('can log out', async () => {
    await page.goto(`${baseUrl}/dashboard`)
    await page.waitForSelector(sel('dashboard'))

    const menuDidOpen = waitForEvent(page, 'ion-menu', 'ionDidOpen')
    await page.click(sel('menu-button'))
    await menuDidOpen

    await page.waitForSelector(sel('logout-button'), { visible: true })

    await page.click(sel('logout-button'))
    await page.waitForSelector(sel('login-form'))
  })

  it('can reset password', async () => {
    await mockSMTPServer.start()

    await page.goto(`${baseUrl}/`)
    await page.waitForSelector(sel('login-form'))

    await page.click(sel('forgot-password-button'))
    await page.waitForSelector('ion-alert')
    await waitForEvent(page, 'ion-alert', 'ionAlertDidPresent')

    await page.click('#email')
    await page.keyboard.type(testUser.email)

    await page.click('.send-button')

    const messages = await mockSMTPServer.waitForMessages(1)

    const urlRegExp = new RegExp(`href="${baseUrl}/reset-password/${testUser.email}/([^"]*)"`)
    const token = messages[0].textAsHtml.match(urlRegExp)[1]
    const url = `${baseUrl}/reset-password/${testUser.email}/${token}`

    await page.goto(url)
    await page.waitForSelector(sel('reset-form'))

    await page.click(sel('password-input'))
    await page.keyboard.type(testUser.password)

    await page.click(sel('confirmedPassword-input'))
    await page.keyboard.type(testUser.password)

    await page.click(sel('reset-button'))
    await page.waitForSelector('ion-toast')
    await waitForEvent(page, 'ion-toast', 'ionToastDidPresent')

    await page.waitForSelector(sel('login-form'), { timeout: 10000 })

    await mockSMTPServer.stop()
  }, 20000)

  it.skip('can login while offline', async () => {
    // TODO
  })
})
