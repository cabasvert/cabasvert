import { createContext, useContext } from 'react'
import { Logger } from '../utils/logger'

const LoggerContext = createContext<Logger>(new Logger('App'))

export function useLog() {
  return useContext(LoggerContext)
}
