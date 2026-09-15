const CURRENT_ORGANIZATION_KEY = 'progressia.current-organization-id'

export function getStoredOrganizationId(): string | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage.getItem(CURRENT_ORGANIZATION_KEY)
}

export function storeOrganizationId(organizationId: string | null): void {
  if (typeof window === 'undefined') return

  if (organizationId) {
    window.sessionStorage.setItem(CURRENT_ORGANIZATION_KEY, organizationId)
  } else {
    window.sessionStorage.removeItem(CURRENT_ORGANIZATION_KEY)
  }
}
