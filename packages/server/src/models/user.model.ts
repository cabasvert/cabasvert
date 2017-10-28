export type User = {
  name: string
  roles: string[]
  metadata: UserMetadata
}

export type UserMetadata = {
  name: string
  email: string
  'password-reset-token'?: {
    hash: string
    expiryDate: string
  }
}
