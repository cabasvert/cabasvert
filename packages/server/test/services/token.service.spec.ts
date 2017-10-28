import 'jasmine'
import 'reflect-metadata'

import '../../src/controllers/user.controller'
import { TokenService } from '../../src/services/token.service'

describe('TokenService', () => {

  let tokenService = new TokenService()

  it('produces correct token and hash', async () => {
    let { token, hash } = await tokenService.generateToken()

    let rehashedToken = await tokenService.hashToken(token)

    expect(rehashedToken).toEqual(hash)
  })
})
