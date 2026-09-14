export type AuthenticatedUser = {
  id: string
  email: string
  is_superuser: boolean
  is_verified: boolean
}

export type LoginCredentials = {
  email: string
  password: string
}
