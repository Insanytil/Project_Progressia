export type AuthenticatedOrganization = {
  id: string
  name: string
  slug: string
  role: 'organization_admin' | 'teacher' | 'student'
}

export type AuthenticatedUser = {
  id: string
  email: string
  is_superuser: boolean
  is_verified: boolean
  organizations: AuthenticatedOrganization[]
}

export type LoginCredentials = {
  email: string
  password: string
}

export type Invitation = {
  email: string
  expires_at: string
}

export type AcceptInvitationInput = {
  token: string
  password: string
}

export type PasswordReset = {
  email: string
  expires_at: string
}

export type AcceptPasswordResetInput = {
  token: string
  password: string
}
