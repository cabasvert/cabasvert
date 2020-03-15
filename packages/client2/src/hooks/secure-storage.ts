import 'capacitor-secure-storage-plugin'
import { Plugins } from '@capacitor/core'
import { isPlatform } from '@ionic/react'

const { SecureStoragePlugin } = Plugins

export function useSecureStorage() {
  const isSecure = isPlatform('capacitor') && (isPlatform('android') || isPlatform('ios'))

  async function getJson<T>(key: string): Promise<T | undefined> {
    if (!isSecure) return undefined

    const data = await SecureStoragePlugin.get({ key })
    console.log('Data', data)
    return data ? JSON.parse(data) : undefined
  }

  async function setJson<T>(key: string, value: T): Promise<boolean> {
    return isSecure && SecureStoragePlugin.set({ key, value: JSON.stringify(value) })
  }

  return { isSecure, getJson, setJson }
}
