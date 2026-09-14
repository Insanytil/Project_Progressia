import type { PaginationMeta } from './organization.types'

export type OrganizationRole = 'organization_admin' | 'teacher' | 'student'

export type UserMembership = {
  organization_id: string
  organization_name: string
  organization_slug: string
  role: OrganizationRole
  is_active: boolean
}

export type PlatformUser = {
  id: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  memberships: UserMembership[]
}

export type PaginatedUsers = {
  items: PlatformUser[]
  pagination: PaginationMeta
}

export type CreatePlatformUserInput = {
  email: string
  organization_id: string | null
  role: OrganizationRole | null
}

export type CreatePlatformUserResult = {
  user: PlatformUser
  invitation_sent: boolean
}

export type UpdatePlatformUserInput = {
  is_active: boolean
}

export type UpdateOrganizationAccessInput = {
  is_active: boolean
}

export type EmailDispatchResult = {
  sent: boolean
}

export type AddOrganizationMembershipInput = {
  user_id: string
  role: OrganizationRole
}
