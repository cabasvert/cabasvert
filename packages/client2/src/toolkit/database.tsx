import { IonButton, IonIcon } from '@ionic/react'
import { useAppState } from '@ionic/react-hooks/app'
import { useStatus } from '@ionic/react-hooks/network'
import { usePlatform } from '@ionic/react-hooks/platform'
import PouchDB from 'pouchdb-core'
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Observable } from 'rxjs'
import { environment, remoteDBOnly } from '../config'
import { Database, newLocalDatabase, newRemoteDatabase, SyncState, SyncStatus } from '../utils/database-helper'
import { useAuth } from './auth'
import { useLog } from './log'
import { useObservable } from './observables'

interface DatabaseContext {
  synchronizationState$: Observable<SyncState>

  createIndex(index: PouchDB.Find.CreateIndexOptions): Promise<void>

  findOne$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper?: (doc: any) => T,
    defaultValue?: () => T,
  ): Observable<T | null>

  findAll$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper?: (doc: any) => T,
    indexer?: (t: T) => string,
  ): Observable<T[]>

  findAllIndexed$<T>(
    query: PouchDB.Find.FindRequest<T>,
    mapper: (doc: any) => T,
    indexer: (t: T) => string,
  ): Observable<Map<string, T>>

  get$<T>(id: string): Observable<T | null>

  put<T>(doc: T & { _id: string }): Promise<T>
  remove<T>(doc: T & { _id: string }): Promise<boolean>
}

const DatabaseContext = createContext<DatabaseContext | undefined>(undefined)

export function useDatabase(): DatabaseContext {
  const context = useContext(DatabaseContext)
  if (!context) throw new Error('No DatabaseProvider in context')
  return context
}

export const DatabaseProvider: React.FC = ({ children }) => {
  const log = useLog()
  const { isLoggedIn, user } = useAuth()
  const { platform } = usePlatform()
  const { state: isActive } = useAppState()
  const { networkStatus } = useStatus()
  const isConnected = networkStatus?.connected || false

  if (!isLoggedIn) throw new Error('Invalid state: User is not logged in!')
  const userName = user?.email
  const databaseName = user?.database || 'cabasvert'

  useEffect(() => log.info(`Went to ${isActive ? 'foreground' : 'background'}`), [isActive])
  useEffect(() => log.info(`Network is ${isConnected ? 'connected' : 'disconnected'}`), [isConnected])

  const localDatabase = useMemo(() => {
    const environmentSuffix = environment.production ? '' : '-dev'
    return newLocalDatabase(`${databaseName}-${userName}${environmentSuffix}`)
  }, [databaseName, userName])

  const remoteDatabaseNeeded = useMemo(
    () => isActive && isConnected && isLoggedIn,
    [isActive, isConnected, isLoggedIn],
  )
  const [remoteDatabase, setRemoteDatabase] = useState<Database | undefined>(undefined)
  const previousRemoteDatabase = usePrevious(remoteDatabase)

  useEffect(() => {
    if (previousRemoteDatabase) closeRemoteDatabase(previousRemoteDatabase, localDatabase)
  }, [previousRemoteDatabase])

  useEffect(() => {
    if (remoteDatabaseNeeded) setRemoteDatabase(createRemoteDatabase(databaseName, localDatabase))
  }, [remoteDatabaseNeeded, databaseName])

  useEffect(() => () => {
    if (remoteDatabase) closeRemoteDatabase(remoteDatabase, localDatabase)
    if (localDatabase) localDatabase.close()
  }, [])

  const database = useMemo(
    () => remoteDBOnly && remoteDatabase ? remoteDatabase : localDatabase,
    [remoteDatabase, localDatabase],
  )

  const context = useMemo(() => ({
    synchronizationState$: database.syncState$,

    async createIndex(index: PouchDB.Find.CreateIndexOptions): Promise<void> {
      await database.withIndex(index)
    },

    findOne$<T>(
      query: PouchDB.Find.FindRequest<T>,
      mapper: (doc: any) => T = d => d,
      defaultValue: () => T | null = () => null,
    ): Observable<T | null> {
      return database.findOne$(query, mapper, defaultValue)
    },

    findAll$<T>(
      query: PouchDB.Find.FindRequest<T>,
      mapper: (doc: any) => T = d => d,
      indexer: (t: T) => string = t => (t as any)._id,
    ): Observable<T[]> {
      return database.findAll$(query, mapper, indexer)
    },

    findAllIndexed$<T>(
      query: PouchDB.Find.FindRequest<T>,
      mapper: (doc: any) => T = d => d,
      indexer: (t: T) => string = t => (t as any)._id,
    ): Observable<Map<string, T>> {
      return database.findAllIndexed$(query, mapper, indexer)
    },

    get$<T>(id: string): Observable<T> {
      return database.get$(id)
    },

    put<T>(doc: T & { _id: string }): Promise<T> {
      return database.put$(doc).toPromise()
    },

    remove<T>(doc: T & { _id: string }): Promise<boolean> {
      return database.remove$(doc).toPromise()
    },
  }), [database])

  return <DatabaseContext.Provider value={context}>{children}</DatabaseContext.Provider>
}

function createRemoteDatabase(databaseName: string, localDatabase: Database) {
  const remote = newRemoteDatabase(databaseName)
  localDatabase.doSync(remote, {
    live: true,
    retry: true,
    continuous: true,
    push: {
      filter: (doc: any) => {
        return !doc._id.startsWith('_design/')
      },
    },
  })
  return remote
}

function closeRemoteDatabase(remoteDatabase: Database, localDatabase: Database) {
  localDatabase.doCancelSync()
  remoteDatabase.close()
}

function usePrevious<T>(value: T) {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export const SynchronizationStateIcon: React.FC = () => {
  const { synchronizationState$ } = useDatabase()
  const [synchronizationState] = useObservable(synchronizationState$)

  const iconForStatus = (s: SyncState | undefined) => {
    if (!s) {
      return 'cloud-outline'
    }
    switch (s.status) {
      case SyncStatus.ACTIVE:
        return 'cloud'
      case SyncStatus.PUSHING:
        return 'cloud-upload'
      case SyncStatus.PULLING:
        return 'cloud-download'
      case SyncStatus.PAUSED:
        return 'cloud-done'
      case SyncStatus.COMPLETE:
        return 'cloud-outline'
    }
  }

  const isAlive = synchronizationState && synchronizationState.status !== SyncStatus.COMPLETE
  const icon = iconForStatus(synchronizationState)

  const forceReset = () => {
  }

  return <IonButton disabled={isAlive} onClick={forceReset}>
    <IonIcon icon={icon} />
  </IonButton>
}
