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

import 'reflect-metadata'

import { TokenService } from './token.service'

describe('TokenService', () => {

  let tokenService = new TokenService()

  it('produces correct token and hash', async () => {
    let { token, hash } = await tokenService.generateToken()

    let isValid = await tokenService.verifyToken(token, hash)

    expect(isValid).toEqual(true)
  })

  it('rejects invalid token', async () => {
    let { token, hash } = await tokenService.generateToken()

    let isValid = await tokenService.verifyToken(token + 'a', hash)

    expect(isValid).toEqual(false)
  })

  it('verifies legacy token', async () => {
    let token = 'legacy-token'
    let legacyHash = await tokenService.hashToken(token)

    let isValid = await tokenService.verifyToken(token, legacyHash)

    expect(isValid).toEqual(true)
  })

  it('rejects invalid legacy token', async () => {
    let token = 'legacy-token'
    let legacyHash = await tokenService.hashToken(token)

    let isValid = await tokenService.verifyToken(token + 'a', legacyHash)

    expect(isValid).toEqual(false)
  })
})
