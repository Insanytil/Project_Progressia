import { useQuery } from '@tanstack/react-query'

import { currentUserQueryOptions } from '@/features/auth'
import { useOrganizationContext } from '@/features/organization-context'

export function DashboardPage() {
  const { data: user } = useQuery(currentUserQueryOptions)
  const { currentOrganization } = useOrganizationContext()

  if (!currentOrganization) {
    return (
      <div className="flex-1 p-5 sm:p-8">
        <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Aucun accès actif</h1>
          <p className="mt-2 text-muted-foreground">
            Votre compte n’est associé à aucune organisation active.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">Progressia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {currentOrganization.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {user ? `Bienvenue, ${user.email}.` : 'Bienvenue dans votre espace.'}
        </p>
      </div>
    </div>
  )
}
