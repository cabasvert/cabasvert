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

import { Inject, Injectable, OnInit } from '@angular/core'
import { Network } from "@ionic-native/network"
import { SecureStorage } from "@ionic-native/secure-storage"
import { Platform } from "ionic-angular"
import { Observable } from "rxjs/Observable"
import { ReplaySubject } from "rxjs/ReplaySubject"
import { Subject } from "rxjs/Subject"

import { environment } from "../../config/configuration"
import { ConfigurationService } from "../../config/configuration.service"

import { Database, DatabaseHelper } from "./database-helper"
import { Logger, LogService } from "./log-service"

export class User {
  constructor(public username: string,
              public roles: [string],
              public name: string,
              public email: string) {
  }

  private immediateHasRole(role: string) {
    return this.roles.indexOf(role) > -1
  }

  public hasRole(role: string) {
    return this.immediateHasRole(Roles.ADMINISTRATOR) || this.immediateHasRole(role)
  }

  public hasAnyRoleIn(roles: string[]) {
    return this.immediateHasRole(Roles.ADMINISTRATOR) || roles.some(role => this.immediateHasRole(role))
  }
}

export class Roles {
  public static readonly MEMBER = 'cabasvert:member'
  public static readonly PRODUCER = 'cabasvert:producer'
  public static readonly DISTRIBUTOR = 'cabasvert:distributor'
  public static readonly ADMINISTRATOR = 'cabasvert:admin'
}

export type Credentials = { username: string, password: string, roles?: [string], name?: string, email?: string }
export type PasswordSet = { oldPassword: string, newPassword: string, confirmedPassword: string, }

const SECURE_STORAGE_NAME = 'CabasVert'
const SECURE_STORAGE_KEY = 'credentials'

@Injectable()
export class AuthService {

  private _logger: Logger

  private get log() {
    if (this._logger == null) this._logger = this.logService.logger('Auth')
    return this._logger
  }

  private userDatabase: Database

  private credentials: Credentials
  private currentUser: User
  private _loggedInUser$: Subject<User | null> = new ReplaySubject(1)

  private _hasPasswordStorage: Promise<boolean>

  constructor(private platform: Platform,
              private secureStorage: SecureStorage,
              private network: Network,
              private logService: LogService,
              private config: ConfigurationService,
              private dbHelper: DatabaseHelper) {
  }

  initialize() {
    let devEnv = false && environment().ionic !== 'prod'
    let safeSecureStorage = devEnv || this.platform.is('android') || this.platform.is('ios')
    this._hasPasswordStorage = !safeSecureStorage ? Promise.resolve(false) :
      this.platform.ready()
        .then(() => this.secureStorage.create(SECURE_STORAGE_NAME))
        .then(storage => !!storage)
        .catch(error => false)

    this.userDatabase = this.dbHelper.newRemoteDatabase("_users")
  }

  public maybeLoadCredentials(): Promise<Credentials> {
    return this._hasPasswordStorage
      .then(has => {
        if (!has) return Promise.resolve<Credentials>(null)

        return this.secureStorage.create(SECURE_STORAGE_NAME)
          .then(storage => storage.get(SECURE_STORAGE_KEY))
          .then(data => {
            this.credentials = data ? JSON.parse(data) : null
            return this.credentials
          })
          .catch(error => {
            return <Credentials>null
          })
      })
  }

  public maybeStoreCredentials(): Promise<void> {
    return this._hasPasswordStorage
      .then(has => {
        if (!has) return Promise.resolve()

        return this.secureStorage.create(SECURE_STORAGE_NAME)
          .then(storage => storage.set(SECURE_STORAGE_KEY, JSON.stringify((this.credentials))))
          .catch(error => this.log.error(`Error from secure storage: ${error}`))
      })
  }

  public login(credentials: Credentials): Promise<boolean> {
    return this.logInOffline(credentials).then(locallyGrantedUser => {
      // If network is down, be satisfied if locally granted
      if (this.network.type == 'none') return locallyGrantedUser

      // Else try to authenticate with remote
      return this.logInToRemote(credentials).catch(error => {
        // In case of network error, again be satisfied if locally granted
        if (locallyGrantedUser) return locallyGrantedUser
        throw error
      })
    }).then(grantedUser => {
      this.credentials = credentials
      this.currentUser = grantedUser
      this._loggedInUser$.next(grantedUser)
      return grantedUser != null
    }).catch(_ => {
      this.credentials = null
      this.currentUser = null
      this._loggedInUser$ = null
      return false
    })
  }

  private logInOffline(credentials: Credentials): Promise<User> {
    this.log.debug(`Attempting to log in user '${credentials.username}' offline`)

    // If credentials are stored in secure storage
    return this.maybeLoadCredentials().then(c => {
      let granted = c && c.username == credentials.username && c.password == credentials.password

      // And if they match, grant access to the user
      if (granted) {
        this.log.info(`Successfully logged in user '${credentials.username}' offline`)
        return new User(credentials.username, credentials.roles, credentials.name, credentials.email)
      } else {
        this.log.warn(`Failed to log in user '${credentials.username}' offline`)
        return null
      }
    })
  }

  private logInToRemote(credentials: Credentials): Promise<User> {
    this.log.debug(`Attempting to log in user '${credentials.username}' to remote`)

    // Try to authenticate with remote
    return this.userDatabase.login(credentials.username, credentials.password).then(ok => {
      if (ok) {
        // Load user's roles and metadata
        return this.userDatabase.getUser(credentials.username).then(userData => {
          this.log.info(`Successfully logged in user '${credentials.username}' to remote`)

          // Copy metadata for offline use
          credentials.roles = userData.roles
          credentials.name = userData.metadata.name
          credentials.email = userData.metadata.email

          return new User(credentials.username, credentials.roles, credentials.name, credentials.email)
        })
      } else {
        this.log.warn(`Failed to log in user '${credentials.username}' to remote`)
        return null
      }
    }).catch(e => {
      this.log.error(`${e}`)
      // Error status 401 also means authentication is denied
      if (e.status === 401) return null
      throw e
    })
  }

  public tryLoadCredentialsAndLogin(): Promise<boolean> {
    return this.maybeLoadCredentials()
      .then(credentials => {
        if (credentials)
          return this.login(credentials).then(granted => {
            if (granted)
              return this.maybeStoreCredentials().then(() => true)
            else return false
          })
        else return false
      })
      .catch(error => false)
  }

  changePassword(passwords: PasswordSet): Promise<boolean> {
    if (passwords.oldPassword != this.credentials.password) return Promise.reject("Invalid old password.")
    if (passwords.newPassword != passwords.confirmedPassword) return Promise.reject("New passwords do not match.")
    return this.userDatabase.changePassword(this.credentials.username, passwords.oldPassword, passwords.newPassword)
      .then(ok => {
        if (ok) {
          this.log.info(`Successfully changed password for user '${this.currentUser.username}'`)
          this.credentials.password = passwords.newPassword
          return true
        } else {
          return false
        }
      })
      .catch(e => {
        this.log.error(`Failed to change password for user '${this.currentUser.username}': ${e}`)
        if (e.status === 404) return false
        throw e
      })
  }

  public logout() {
    return Promise.resolve().then(() => {
      if (this.network.type == 'none') return
      return this.logOutFromRemote()
    }).then(() => {
      this.credentials = null
      this.currentUser = null
      this._loggedInUser$.next(this.currentUser)
    }).catch(_ => {
      this.credentials = null
      this.currentUser = null
      this._loggedInUser$.next(this.currentUser)
    })
  }

  private logOutFromRemote() {
    this.log.debug(`Attempting to log out user '${this.currentUser.username}' from remote`)
    return this.userDatabase.logout().then(() => {
      this.log.info(`Successfully logged out user '${this.currentUser.username}' from remote`)
    }).catch(e => {
      this.log.error(`Failed to log out user '${this.currentUser.username}' from remote: ${e}`)

      // The logout call always fail on Firefox, so we disable the error.
      // (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’)
      // despite that OPTIONS is indeed listed in the CORS configuration.

      // if (e.status === 401) return
      // throw e
    })
  }

  get hasPasswordStorage(): Promise<boolean> {
    return this._hasPasswordStorage
  }

  get loggedInUser$(): Observable<User | any> {
    return this._loggedInUser$
  }

  public loginDatabase(database: Database) {
    return database.login(this.credentials.username, this.credentials.password)
  }

  public logoutDatabase(database: Database) {
    return database.logout()
  }
}
