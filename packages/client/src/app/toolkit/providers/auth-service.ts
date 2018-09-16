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

import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfigurationService } from '../../config/configuration.service';

import { Database, DatabaseHelper } from './database-helper';
import { LogService } from './log-service';
import { Logger } from './logger';

export class User {
  constructor(public username: string,
              public roles: string[],
              public name: string,
              public email: string) {
  }

  private immediateHasRole(role: string) {
    return this.roles.indexOf(role) > -1;
  }

  public hasRole(role: string) {
    return this.immediateHasRole(Roles.ADMINISTRATOR) || this.immediateHasRole(role);
  }

  public hasAnyRoleIn(roles: string[]) {
    return this.immediateHasRole(Roles.ADMINISTRATOR) || roles.some(role => this.immediateHasRole(role));
  }
}

export class Roles {
  public static readonly MEMBER = 'cabasvert:member';
  public static readonly PRODUCER = 'cabasvert:producer';
  public static readonly DISTRIBUTOR = 'cabasvert:distributor';
  public static readonly ADMINISTRATOR = 'cabasvert:admin';
}

export interface Credentials {
  username: string;
  password: string;
  roles?: string[];
  name?: string;
  email?: string;
}

export interface PasswordSet {
  oldPassword: string;
  newPassword: string;
  confirmedPassword: string;
}

const SECURE_STORAGE_NAME = 'CabasVert';
const SECURE_STORAGE_KEY = 'credentials';

@Injectable()
export class AuthService {

  private _logger: Logger;

  private get log() {
    if (this._logger == null) {
      this._logger = this.logService.logger('Auth');
    }
    return this._logger;
  }

  private userDatabase: Database;

  private credentials: Credentials;
  private currentUser: User;
  private _loggedInUser$: Subject<User | null> = new BehaviorSubject(null);

  private _passwordStorage: Promise<SecureStorageObject>;

  constructor(private platform: Platform,
              private secureStorage: SecureStorage,
              private network: Network,
              private logService: LogService,
              private config: ConfigurationService,
              private dbHelper: DatabaseHelper) {
  }

  initialize() {
    const devEnv = !environment.production;

    this._passwordStorage = this.setupPasswordStorage();

    this.userDatabase = this.dbHelper.newRemoteDatabase('_users');
  }

  private async setupPasswordStorage() {
    // FIXME ionic-team/capacitor#787
    return null;

    // const safeSecureStorage =
    //   (this.platform.is('capacitor') && (this.platform.is('android') || this.platform.is('ios')));
    //
    // if (!safeSecureStorage) return null;
    //
    // await this.platform.ready();
    //
    // try {
    //   return await this.secureStorage.create(SECURE_STORAGE_NAME);
    // } catch (error) {
    //   this.log.error(`Error from secure storage: ${error}`);
    //   return null;
    // }
  }

  public async tryLoadCredentials(): Promise<Credentials> {
    let storage = await this._passwordStorage;
    if (!storage) {
      if (environment.loadDevCredentials) return await this.config.tryLoadDevCredentials();
      else return null;
    }

    try {
      let data = await storage.get(SECURE_STORAGE_KEY);
      this.credentials = data ? JSON.parse(data) : null;
      return this.credentials;
    } catch (error) {
      this.log.error(`Error from secure storage: ${error}`);
      return <Credentials>null;
    }
  }

  public async tryStoreCredentials(): Promise<void> {
    let storage = await this._passwordStorage;
    if (!storage) return Promise.resolve();

    try {
      await storage.set(SECURE_STORAGE_KEY, JSON.stringify((this.credentials)));
    } catch (error) {
      this.log.error(`Error from secure storage: ${error}`);
    }
  }

  public async tryRestoreSession(): Promise<boolean> {
    try {
      // Try to restore a previous session
      const session = await this.userDatabase.getSession();
      if (session && session.ok && session.userCtx && session.userCtx.name) {
        let username = session.userCtx.name;
        this.log.info(`Restored session for user '${username}'`);

        let user = await this.retrieveUser(username);
        this.notifyLoggedUser(null, user);
        return true;
      } else {
        this.notifyLoggedUser(null, null);
        return false;
      }
    } catch (error) {
      this.notifyLoggedUser(null, null);
      return false;
    }
  }

  public async login(credentials: Credentials): Promise<boolean> {
    let grantedUser = await this.logInOffline(credentials);

    // Try to authenticate with remote
    // TODO Should we log in to remote asynchronously ?
    try {
      grantedUser = await this.logInToRemote(credentials);
    } catch (error) {
      // In case of network error, be satisfied if locally granted
      if (!grantedUser) {
        this.notifyLoggedUser(null, null);
        return false;
      }
    }

    this.notifyLoggedUser(credentials, grantedUser);
    return grantedUser != null;
  }

  private notifyLoggedUser(credentials: Credentials, user: User) {
    this.credentials = credentials;
    this.currentUser = user;
    this._loggedInUser$.next(user);
  }

  private async logInOffline(credentials: Credentials): Promise<User> {
    this.log.debug(`Attempting to log in user '${credentials.username}' offline`);

    // If credentials are stored in secure storage
    let storedCredentials = await this.tryLoadCredentials();
    const granted = storedCredentials &&
      storedCredentials.username === credentials.username &&
      storedCredentials.password === credentials.password;

    // And if they match, grant access to the user
    if (granted) {
      this.log.info(`Successfully logged in user '${credentials.username}' offline`);
      return new User(credentials.username, credentials.roles, credentials.name, credentials.email);
    } else {
      this.log.warn(`Failed to log in user '${credentials.username}' offline`);
      return null;
    }
  }

  private async logInToRemote(credentials: Credentials): Promise<User> {
    this.log.debug(`Attempting to log in user '${credentials.username}' to remote`);

    try {
      // Try to authenticate with remote
      const ok = await this.userDatabase.login(credentials.username, credentials.password);

      if (ok) {
        this.log.info(`Successfully logged in user '${credentials.username}' to remote`);
        let user = await this.retrieveUser(credentials.username);

        // Copy metadata for offline use
        credentials.roles = user.roles;
        credentials.name = user.name;
        credentials.email = user.email;

        return user;
      } else {
        this.log.warn(`Failed to log in user '${credentials.username}' to remote`);
        return null;
      }
    } catch (error) {
      this.log.error(`${error}`);
      // Error status 401 also means authentication is denied
      if (error.status === 401) {
        return null;
      }
      throw error;
    }
  }

  private async retrieveUser(username: any) {
    const userData = await this.userDatabase.getUser(username);
    return new User(username, userData.roles, userData.metadata.name, userData.metadata.email);
  }

  public async tryRestoreSessionOrLoadCredentialsAndLogin(): Promise<boolean> {
    let sessionRestored = await this.tryRestoreSession();
    if (sessionRestored) return true;

    let credentials = await this.tryLoadCredentials();
    return !!credentials ? await this.login(credentials) : false;
  }

  public async changePassword(passwords: PasswordSet): Promise<boolean> {
    if (!this.currentUser) throw new Error('Invalid state: user is not logged in');

    let username = this.currentUser.username;
    this.credentials = {
      username: username,
      password: passwords.oldPassword,
    };

    if (!await this.logInToRemote(this.credentials)) {
      throw new Error('Invalid old password.');
    }
    if (passwords.newPassword !== passwords.confirmedPassword) {
      throw new Error('New passwords don\'t match.');
    }

    try {
      let ok = await this.userDatabase.changePassword(username, passwords.oldPassword, passwords.newPassword);
      if (ok) {
        this.log.info(`Successfully changed password for user '${username}'`);

        // Log in with new credentials
        this.credentials.password = passwords.newPassword;
        await this.login(this.credentials);

        return true;
      } else {
        return false;
      }
    } catch (e) {
      this.log.error(`Failed to change password for user '${username}': ${e}`);
      if (e.status === 404) {
        return false;
      }
      throw e;
    }
  }

  public async logout() {
    if (this.network.type === 'none') {
      return;
    }

    try {
      await this.logOutFromRemote();
      this.notifyLoggedUser(null, null);
    } catch (error) {
      this.notifyLoggedUser(null, null);
    }
  }

  private async logOutFromRemote() {
    this.log.debug(`Attempting to log out user '${this.currentUser.username}' from remote`);
    try {
      await this.userDatabase.logout();
      this.log.info(`Successfully logged out user '${this.currentUser.username}' from remote`);
    } catch (error) {
      this.log.error(`Failed to log out user '${this.currentUser.username}' from remote: ${error}`);

      // The logout call always fail on Firefox, so we disable the error.
      // (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’)
      // despite that OPTIONS is indeed listed in the CORS configuration.

      // if (e.status === 401) return
      // throw e
    }
  }

  get hasPasswordStorage(): Promise<boolean> {
    return this._passwordStorage.then(storage => !!storage);
  }

  get loggedInUser$(): Observable<User | null> {
    return this._loggedInUser$;
  }

  public async loginDatabase(database: Database) {
    if (this.currentUser != null) return true;
    return await database.login(this.credentials.username, this.credentials.password);
  }

  public async logoutDatabase(database: Database) {
    return await database.logout();
  }
}
