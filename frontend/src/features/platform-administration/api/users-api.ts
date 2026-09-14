import { apiClient } from '@/lib/api/client'

import type {
  AddOrganizationMembershipInput,
  CreatePlatformUserInput,
  CreatePlatformUserResult,
  EmailDispatchResult,
  PaginatedUsers,
  UpdateOrganizationAccessInput,
  UpdatePlatformUserInput,
} from '../model/user.types'

export type UserListParams = {
  page: number
  pageSize: number
  search?: string
  organizationId?: string
  isActive?: boolean
}

export async function getPlatformUsers(params: UserListParams): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/platform/users', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      search: params.search || undefined,
      organization_id: params.organizationId,
      is_active: params.isActive,
    },
  })
  return data
}

export async function updatePlatformUser(
  userId: string,
  input: UpdatePlatformUserInput,
): Promise<void> {
  await apiClient.patch(`/platform/users/${userId}`, input)
}

export async function updateUserOrganizationAccess(
  userId: string,
  organizationId: string,
  input: UpdateOrganizationAccessInput,
): Promise<void> {
  await apiClient.patch(
    `/platform/users/${userId}/organizations/${organizationId}`,
    input,
  )
}

export async function addUserToOrganization(
  organizationId: string,
  input: AddOrganizationMembershipInput,
): Promise<void> {
  await apiClient.post(`/platform/organizations/${organizationId}/members`, input)
}

export async function resendVerificationEmail(
  userId: string,
): Promise<EmailDispatchResult> {
  const { data } = await apiClient.post<EmailDispatchResult>(
    `/platform/users/${userId}/verification-email`,
  )
  return data
}

export async function sendPasswordResetEmail(
  userId: string,
): Promise<EmailDispatchResult> {
  const { data } = await apiClient.post<EmailDispatchResult>(
    `/platform/users/${userId}/password-reset-email`,
  )
  return data
}

export async function createPlatformUser(
  input: CreatePlatformUserInput,
): Promise<CreatePlatformUserResult> {
  const { data } = await apiClient.post<CreatePlatformUserResult>('/platform/users', input)
  return data
}
