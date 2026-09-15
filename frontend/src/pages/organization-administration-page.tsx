import { Navigate } from '@tanstack/react-router'

import { OrganizationAdministrationTabs } from '@/features/organization-administration/components/organization-administration-tabs'
import { useOrganizationContext } from '@/features/organization-context'

export function OrganizationAdministrationPage() {
  const { currentOrganization } = useOrganizationContext()

  if (currentOrganization?.role !== 'organization_admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden p-5 sm:p-8">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col">
        <OrganizationAdministrationTabs />
      </div>
    </div>
  )
}
