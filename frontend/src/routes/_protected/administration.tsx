import { createFileRoute } from '@tanstack/react-router'

import { requireCurrentOrganizationAdmin } from '@/features/auth'
import { OrganizationAdministrationPage } from '@/pages/organization-administration-page'

export const Route = createFileRoute('/_protected/administration')({
  beforeLoad: ({ context }) => requireCurrentOrganizationAdmin(context.queryClient),
  component: OrganizationAdministrationPage,
})
