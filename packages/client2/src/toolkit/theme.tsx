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

import { useStorage } from '@ionic/react-hooks/storage'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | undefined

const THEME_STORAGE_KEY = 'user_prefs_theme'

interface ThemeControl {
  theme: Theme
  changeTheme: (newTheme: Theme) => void
}

const ThemeContext = createContext<ThemeControl | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('No ThemeProvider in context')
  return context
}

export const ThemeProvider: React.FC = ({ children }) => {
  const { get, set, remove } = useStorage()
  const [theme, setTheme] = useState<Theme>()
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

  const retrieveThemeSetting = useCallback(async () => {
    const storedTheme = await get(THEME_STORAGE_KEY)
    setTheme((storedTheme || undefined) as Theme)
  }, [])

  const applyTheme = useCallback(() => {
    const applyDarkTheme = theme ? theme === 'dark' : prefersDark.matches
    document.body.classList.toggle('dark', applyDarkTheme)
  }, [theme, prefersDark])

  const changeTheme = useCallback(async (newTheme: Theme) => {
    setTheme(newTheme)

    if (newTheme) await set(THEME_STORAGE_KEY, newTheme)
    else await remove(THEME_STORAGE_KEY)
  }, [])

  useEffect(() => {
    retrieveThemeSetting()
  }, [])

  useEffect(() => {
    prefersDark.addEventListener('change', () => applyTheme())
    return () => {
      prefersDark.removeEventListener('change', () => applyTheme())
    }
  }, [prefersDark])

  useEffect(() => {
    applyTheme()
  }, [theme])

  const themeControl = useMemo(() => ({ theme, changeTheme }), [theme, changeTheme])

  return <ThemeContext.Provider value={themeControl}>{children}</ThemeContext.Provider>
}
