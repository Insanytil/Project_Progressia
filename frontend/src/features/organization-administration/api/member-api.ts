import { apiClient } from '@/lib/api/client'

import type {
  CreateOrganizationMemberInput,
  CreateOrganizationMemberResult,
  EmailDispatchResult,
  OrganizationMemberListParams,
  PaginatedOrganizationMembers,
  UpdateOrganizationMemberInput,
} from '../model/member.types'

const scopeHeaders = (organizationId: string) => ({
  'X-Organization-ID': organizationId,
})

export async function createOrganizationMember(
  organizationId: string,
  input: CreateOrganizationMemberInput,
): Promise<CreateOrganizationMemberResult> {
  const { data } = await apiClient.post<CreateOrganizationMemberResult>(
    '/organization-administration/members',
    input,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}

export async function getOrganizationMembers(
  organizationId: string,
  params: OrganizationMemberListParams,
): Promise<PaginatedOrganizationMembers> {
  const { data } = await apiClient.get<PaginatedOrganizationMembers>(
    '/organization-administration/members',
    {
      headers: scopeHeaders(organizationId),
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search,
        is_active: params.isActive,
      },
    },
  )
  return data
}

export async function updateOrganizationMember(
  organizationId: string,
  userId: string,
  input: UpdateOrganizationMemberInput,
): Promise<void> {
  await apiClient.patch(`/organization-administration/members/${userId}`, input, {
    headers: scopeHeaders(organizationId),
  })
}

export async function sendOrganizationMemberPasswordReset(
  organizationId: string,
  userId: string,
): Promise<EmailDispatchResult> {
  const { data } = await apiClient.post<EmailDispatchResult>(
    `/organization-administration/members/${userId}/password-reset-email`,
    undefined,
    { headers: scopeHeaders(organizationId) },
  )
  return data
}
