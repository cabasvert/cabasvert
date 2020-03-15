import React, { createContext, useContext, useState } from 'react'
import { useSecureStorage } from './secure-storage'

interface UserCredentials {
  username: string
  password: string
  data?: UserData
}

interface UserData {
  roles: string[]
  name: string
  email: string
  database?: string
}

export interface User {
  name: string,
  email: string,
  hasRole: (...roles: string[]) => boolean
}

export class Roles {
  public static readonly MEMBER = 'cabasvert:member'
  public static readonly PRODUCER = 'cabasvert:producer'
  public static readonly DISTRIBUTOR = 'cabasvert:distributor'
  public static readonly ADMINISTRATOR = 'cabasvert:admin'
}

export interface AuthContext {
  login: (userName: string, password: string, storePassword?: boolean) => Promise<void>
  logout: () => Promise<void>
  isLoggedIn: boolean
  user: User | undefined
}

const AuthContext = createContext<AuthContext | null>(null)

export function useAuth(): AuthContext {
  const context = useContext(AuthContext)
  if (!context) throw new Error('No AuthProvider in context')
  return context
}

export const AuthProvider: React.FC = ({ children }) => {
  const { get, set } = useSecureStorage()
  const [user, setUser] = useState<User | undefined>(undefined)

  const login = async (userName: string, password: string, storePassword: boolean = false) => {
    console.log('login', userName)
    setUser({ name: userName, email: 'didier@didier.com', hasRole: () => true})
  }

  const logout = async () => {
    setUser(undefined)
  }

  const isLoggedIn = user !== undefined

  const context: AuthContext = { login, logout, isLoggedIn, user }

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}
