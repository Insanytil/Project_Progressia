export type Organization = {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type OrganizationListParams = {
  page: number
  pageSize: number
  search?: string
  isActive?: boolean
}

export type PaginationMeta = {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export type PaginatedOrganizations = {
  items: Organization[]
  pagination: PaginationMeta
}

export type CreateOrganizationInput = {
  name: string
  slug: string
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput> & {
  is_active?: boolean
}
