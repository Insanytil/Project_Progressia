import { apiClient } from '@/lib/api/client'

import type {
  CreateOrganizationInput,
  Organization,
  OrganizationListParams,
  PaginatedOrganizations,
  UpdateOrganizationInput,
} from '../model/organization.types'

export async function getOrganizations(params: OrganizationListParams): Promise<PaginatedOrganizations> {
  const { data } = await apiClient.get<PaginatedOrganizations>('/platform/organizations', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      search: params.search || undefined,
      is_active__eq: params.isActive,
    },
  })

  return data
}

export async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  const { data } = await apiClient.post<Organization>('/platform/organizations', input)
  return data
}

export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  const { data } = await apiClient.patch<Organization>(
    `/platform/organizations/${organizationId}`,
    input,
  )
  return data
}

export async function deleteOrganization(organizationId: string): Promise<void> {
  await apiClient.delete(`/platform/organizations/${organizationId}`)
}
