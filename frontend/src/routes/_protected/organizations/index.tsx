import { createFileRoute } from '@tanstack/react-router'

import { OrganizationSelectionPage } from '@/pages/organization-selection-page'

export const Route = createFileRoute('/_protected/organizations/')({
  component: OrganizationSelectionPage,
})
