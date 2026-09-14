import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireOrganizationScope } from '@/features/auth'

export const Route = createFileRoute('/_protected/organizations/$organizationSlug')({
  beforeLoad: async ({ context, params }) => ({
    organization: await requireOrganizationScope(
      context.queryClient,
      params.organizationSlug,
    ),
  }),
  component: Outlet,
})
