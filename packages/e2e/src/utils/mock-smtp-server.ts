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

import { ParsedMail, simpleParser } from 'mailparser'
import { SMTPServer, SMTPServerAuthentication, SMTPServerAuthenticationResponse, SMTPServerSession } from 'smtp-server'
import { Readable } from 'stream'

type Authenticator = (auth: SMTPServerAuthentication, session: SMTPServerSession) => Promise<SMTPServerAuthenticationResponse>

export const allPassAuthenticator: Authenticator = async (auth) => ({ user: auth.username })

export interface MockSMTPConfig {
  host?: string
  port?: number
  secure?: boolean
  hideSTARTTLS?: boolean
  authenticator?: Authenticator
}

export class MockSMTPServer {

  private delegate: SMTPServer

  public messages: ParsedMail[] = []

  constructor(private config?: MockSMTPConfig = {}) {
    this.delegate = new SMTPServer({
      secure: config.secure !== undefined ? config.secure : false,
      hideSTARTTLS: config.hideSTARTTLS !== undefined ? config.hideSTARTTLS : true,
      onAuth: handleAuth(config.authenticator || allPassAuthenticator),
      onData: handleData(mail => this.messages.push(mail)),
    })
  }

  public start(): Promise<void> {
    return new Promise(resolve => {
      this.delegate.listen(this.config.port || 2025, this.config.host || 'localhost', () => resolve())
    })
  }

  public stop(): Promise<void> {
    return new Promise<void>(resolve => {
      this.delegate.close(() => resolve())
    })
  }

  public clearMessages() {
    this.messages = []
  }

  public async waitForMessages(count: number, timeout?: number = 10000): Promise<ParsedMail[]> {
    await Promise.race([
      untilCondition(() => this.messages.length === count),
      untilTimeout(timeout),
    ])

    if (this.messages.length < count) {
      throw new Error(`Wait for ${count} messages failed with timeout of ${timeout} ms.`)
    }

    return this.messages
  }
}

type OnAuthHandler = (auth: SMTPServerAuthentication,
                      session: SMTPServerSession,
                      callback: (err: Error | null | undefined, response: SMTPServerAuthenticationResponse) => void) => void
type OnDataHandler = (stream: Readable, session: SMTPServerSession, callback: (err?: Error | null) => void) => void

function handleAuth(authenticator: Authenticator): OnAuthHandler {
  return ((auth, session, callback) => {
    authenticator(auth, session)
      .then(result => callback(undefined, result))
      .catch(error => callback(new Error('Authentication failed')))
  })
}

function handleData(handleMessage: (mail: ParsedMail) => void): OnDataHandler {
  return (stream, session, callback) => {
    simpleParser(stream, (err, mail) => {
      handleMessage(mail)
      callback(err)
    })
  }
}

function untilCondition(condition: () => boolean): Promise<void> {
  const poll = resolve => {
    if (condition()) resolve()
    else setTimeout(() => poll(resolve), 100)
  }
  return new Promise(poll)
}

function untilTimeout(timeout): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout))
}
