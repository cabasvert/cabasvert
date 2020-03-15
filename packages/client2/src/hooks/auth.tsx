import React, { createContext, useContext, useEffect, useState } from 'react'
import { newRemoteDatabase } from '../utils/database-helper'
import { Logger } from '../utils/logger'
import { useSecureStorage } from './secure-storage'

interface UserSession {
  userName: string
  password: string
  data: UserData
}

interface UserData {
  name: string
  email: string
  database: string
  roles: string[]
}

export interface User extends UserData {
  hasRole: (...roles: string[]) => boolean
}

export class Roles {
  public static readonly MEMBER = 'cabasvert:member'
  public static readonly PRODUCER = 'cabasvert:producer'
  public static readonly DISTRIBUTOR = 'cabasvert:distributor'
  public static readonly ADMINISTRATOR = 'cabasvert:admin'
}

export interface AuthContext {
  hasPasswordStorage: boolean
  login: (userName: string, password: string, storePassword?: boolean) => Promise<void>
  logout: () => Promise<void>
  isLoggedIn: boolean
  user: User | undefined
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

export function useAuth(): AuthContext {
  const context = useContext(AuthContext)
  if (!context) throw new Error('No AuthProvider in context')
  return context
}

const SESSION_STORAGE_KEY = 'user_session'

export const AuthProvider: React.FC = ({ children }) => {
  const { isSecure, getJson, setJson } = useSecureStorage()
  const log = new Logger('Auth')
  const userDatabase = newRemoteDatabase('_users')
  const [session, setSession] = useState<UserSession | undefined>(undefined)

  const hasPasswordStorage = isSecure
  const loadSession = async () => getJson<UserSession>(SESSION_STORAGE_KEY)
  const storeSession = async (session: UserSession) => setJson<UserSession>(SESSION_STORAGE_KEY, session)

  const remoteLogin = async (userName: string, password: string, storePassword: boolean): Promise<void> => {
    log.debug(`Attempting to log in user '${userName}' to remote`)
    if (await userDatabase.login(userName, password)) {
      log.debug(`Successfully logged in user '${userName}' to remote`)
      const userData = await userDatabase.getUser(userName)
      const session = {
        userName, password, data: {
          roles: userData.roles,
          name: userData.metadata.name,
          email: userData.metadata.email,
          database: userData.metadata.database,
        },
      }
      setSession(session)
      if (storePassword) await storeSession(session)
    } else {
      log.warn(`Failed to log in user '${userName}' to remote`)
    }
  }

  const login = async (userName: string, password: string, storePassword: boolean = false): Promise<void> => {
    const storedSession = await loadSession()
    const grantedLocally = storedSession && storedSession.userName === userName && storedSession.password === password

    if (!grantedLocally) await remoteLogin(userName, password, storePassword)
    else {
      // TODO Asynchronous login (login each time the network is available again)
      remoteLogin(userName, password, false)
    }
  }

  const logout = async () => {
    setSession(undefined)
  }

  const tryLogin = async () => {
    const storedSession = await loadSession()
    if (storedSession) await login(storedSession.userName, storedSession.password, false)
  }

  useEffect(() => {
    tryLogin()
  }, [])

  const immediateHasRole = (role: string) => session && session.data.roles.indexOf(role) > -1
  const hasRole = (...roles: string[]) => immediateHasRole(Roles.ADMINISTRATOR) || roles.some(role => immediateHasRole(role))
  const user = session && { ...session.data, hasRole }
  const isLoggedIn = user !== undefined

  const context: AuthContext = { hasPasswordStorage, login, logout, isLoggedIn, user }

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}
