import { createFileRoute, Outlet } from '@tanstack/react-router'

import { requireSuperuser } from '@/features/auth'

export const Route = createFileRoute('/_protected/_superuser')({
  beforeLoad: ({ context }) => requireSuperuser(context.queryClient),
  component: Outlet,
})
