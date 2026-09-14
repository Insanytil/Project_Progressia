import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireOrganizationUser } from '@/features/auth'

export const Route = createFileRoute('/_protected/organizations')({
  beforeLoad: ({ context }) => requireOrganizationUser(context.queryClient),
  component: Outlet,
})
