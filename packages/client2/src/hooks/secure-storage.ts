import 'capacitor-secure-storage-plugin'
import { Plugins } from '@capacitor/core'

const { SecureStoragePlugin } = Plugins

export function useSecureStorage() {
  const isSecure = false

  async function get(key: string) {
    return SecureStoragePlugin.get({ key })
  }

  async function set(key: string, value: string): Promise<boolean> {
    return SecureStoragePlugin.set({ key, value })
  }

  return { isSecure, get, set }
}
