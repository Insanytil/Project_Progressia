import { createFileRoute } from '@tanstack/react-router'

import { DashboardPage } from '@/pages/dashboard-page'

export const Route = createFileRoute(
  '/_protected/organizations/$organizationSlug/dashboard',
)({
  component: OrganizationDashboardRoute,
})

function OrganizationDashboardRoute() {
  const { organization } = Route.useRouteContext()
  return <DashboardPage organization={organization} />
}
