import { useQuery } from '@tanstack/react-query'

import { Skeleton } from '@/components/ui/skeleton'
import { currentUserQueryOptions } from '@/features/auth'

import { DefaultOrganizationForm } from './default-organization-form'

export function AccountSettings() {
  const { data: user } = useQuery(currentUserQueryOptions)

  return (
    <main className="min-h-0 flex-1 overflow-auto p-5 sm:p-8">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personnalisez le comportement de votre compte Progressia.
          </p>
        </div>

        {user ? (
          <DefaultOrganizationForm user={user} />
        ) : (
          <Skeleton className="h-64 w-full rounded-xl" />
        )}
      </div>
    </main>
  )
}
