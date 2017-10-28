import { enc, PBKDF2 } from 'crypto-js'
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
    let hash = await this.hashToken(token)

    return { token, hash }
  }

  async hashToken(token: string): Promise<string> {
    return enc.Base64.stringify(PBKDF2(token, HARDCODED_SALT, { keySize: KEY_SIZE, iterations: ITERATION_COUNT }))
  }
}
