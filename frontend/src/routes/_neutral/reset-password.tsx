import { createFileRoute } from '@tanstack/react-router'

import { PasswordResetPage } from '@/pages/password-reset-page'

export const Route = createFileRoute('/_neutral/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: PasswordResetRoute,
})

function PasswordResetRoute() {
  const { token } = Route.useSearch()
  return <PasswordResetPage token={token} />
}
