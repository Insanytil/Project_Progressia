import { createFileRoute } from '@tanstack/react-router'

import { redirectToAuthenticatedHome } from '@/features/auth'

export const Route = createFileRoute('/_protected/dashboard')({
  beforeLoad: ({ context }) => redirectToAuthenticatedHome(context.queryClient),
})
