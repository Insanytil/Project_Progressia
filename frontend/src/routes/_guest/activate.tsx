import { createFileRoute } from '@tanstack/react-router'

import { ActivationPage } from '@/pages/activation-page'

export const Route = createFileRoute('/_guest/activate')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ActivationRoute,
})

function ActivationRoute() {
  const { token } = Route.useSearch()
  return <ActivationPage token={token} />
}
