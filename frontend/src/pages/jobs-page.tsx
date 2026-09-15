import { useQuery } from '@tanstack/react-query'
import { Navigate } from '@tanstack/react-router'

import { currentUserQueryOptions } from '@/features/auth'
import { JobManagement } from '@/features/jobs/components/job-management'
import { useOrganizationContext } from '@/features/organization-context'
import { useOrganizationOptions } from '@/features/platform-administration/hooks/use-organization-options'

function PlatformJobs() {
  const organizationOptions = useOrganizationOptions()
  return <JobManagement scope={{ kind: 'platform' }} organizations={organizationOptions.organizations} />
}

function OrganizationJobs({ organizationId }: { organizationId: string }) {
  return <JobManagement scope={{ kind: 'organization', organizationId }} />
}

export function JobsPage() {
  const { data: user } = useQuery(currentUserQueryOptions)
  const { currentOrganization } = useOrganizationContext()

  if (user?.is_superuser) {
    return <div className="flex min-h-0 flex-1 overflow-hidden p-5 sm:p-8"><div className="mx-auto flex min-h-0 w-full max-w-7xl flex-col"><PlatformJobs /></div></div>
  }
  if (currentOrganization?.role !== 'organization_admin') {
    return <Navigate to="/dashboard" replace />
  }
  return <div className="flex min-h-0 flex-1 overflow-hidden p-5 sm:p-8"><div className="mx-auto flex min-h-0 w-full max-w-7xl flex-col"><OrganizationJobs organizationId={currentOrganization.id} /></div></div>
}
