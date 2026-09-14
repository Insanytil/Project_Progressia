import { useQuery } from '@tanstack/react-query'

import { currentUserQueryOptions } from '@/features/auth'

export function HomePage() {
  const { data, isLoading } = useQuery(currentUserQueryOptions)

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold text-primary">Progressia</h1>
      <p className="mt-2 text-muted-foreground">
        {data ? `Bienvenue, ${data.email}.` : 'Bienvenue sur Progressia.'}
      </p>
    </main>
  )
}
