import { useQuery } from '@tanstack/react-query'

import { currentUserQueryOptions } from '@/features/auth'

export function DashboardPage() {
  const { data: user } = useQuery(currentUserQueryOptions)

  return (
    <div className="flex-1 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">Progressia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          {user ? `Bienvenue, ${user.email}.` : 'Bienvenue dans votre espace.'}
        </p>
      </div>
    </div>
  )
}
