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

import { enc, PBKDF2 } from 'crypto-js'
import * as crypto from 'crypto'
import { injectable } from 'inversify'
import * as UIDGenerator from 'uid-generator'

const HARDCODED_SALT = 'cabasvert-2017'
const KEY_SIZE = 128 / 32
const ITERATION_COUNT = 10000

@injectable()
export class TokenService {

  // Use a 512-bit UID encoded in base62
  private uidGenerator = new UIDGenerator(256, UIDGenerator.BASE62)

  async generateToken(): Promise<{ token: string, hash: string }> {

    let token = await this.uidGenerator.generate()
    let salt = crypto.randomBytes(16).toString('hex')
    let hash = enc.Base64.stringify(PBKDF2(token, salt, { keySize: KEY_SIZE, iterations: ITERATION_COUNT }))

    return { token, hash: `${salt}:${hash}` }
  }

  async verifyToken(token: string, storedHash: string): Promise<boolean> {
    let salt: string
    let expectedHash: string

    if (storedHash.includes(':')) {
      [salt, expectedHash] = storedHash.split(':')
    } else {
      salt = HARDCODED_SALT
      expectedHash = storedHash
    }

    let hash = enc.Base64.stringify(PBKDF2(token, salt, { keySize: KEY_SIZE, iterations: ITERATION_COUNT }))

    let hashBuffer = Buffer.from(hash)
    let expectedHashBuffer = Buffer.from(expectedHash)

    if (hashBuffer.length !== expectedHashBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(hashBuffer, expectedHashBuffer)
  }

  async hashToken(token: string): Promise<string> {
    return enc.Base64.stringify(PBKDF2(token, HARDCODED_SALT, { keySize: KEY_SIZE, iterations: ITERATION_COUNT }))
  }
}
