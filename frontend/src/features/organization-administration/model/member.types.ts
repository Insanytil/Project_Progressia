import type { MembershipRole } from '@/features/memberships/components/membership-access-dialog'
export type OrganizationMember = {
  id: string
  email: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  role: MembershipRole
  membership_is_active: boolean
}

export type PaginatedOrganizationMembers = {
  items: OrganizationMember[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export type OrganizationMemberListParams = {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
}

export type UpdateOrganizationMemberInput = {
  role?: MembershipRole
  is_active?: boolean
}

export type EmailDispatchResult = { queued: boolean }

export type CreateOrganizationMemberInput = {
  email: string
  role: MembershipRole
}

export type CreateOrganizationMemberResult = {
  member: OrganizationMember
  invitation_queued: boolean
}
