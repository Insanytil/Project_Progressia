import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { currentUserQueryOptions } from '@/features/auth'
import type { AuthenticatedOrganization } from '@/features/auth'

const roleLabels: Record<AuthenticatedOrganization['role'], string> = {
  organization_admin: 'Administrateur',
  teacher: 'Enseignant',
  student: 'Étudiant',
}

export function OrganizationSelectionPage() {
  const { data: user } = useQuery(currentUserQueryOptions)
  const organizations = user?.organizations ?? []

  return (
    <main className="flex min-h-0 flex-1 overflow-auto p-5 sm:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Choisissez une organisation</h1>
        <p className="mt-1 text-muted-foreground">
          Votre espace et vos permissions dépendront de l’organisation sélectionnée.
        </p>

        {organizations.length === 0 ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Aucun accès actif</CardTitle>
              <CardDescription>
                Votre compte n’est actuellement associé à aucune organisation active.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {organizations.map((organization) => (
              <Card key={organization.id}>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 />
                  </div>
                  <CardTitle>{organization.name}</CardTitle>
                  <CardDescription>{roleLabels[organization.role]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    render={(
                      <Link
                        to="/organizations/$organizationSlug/dashboard"
                        params={{ organizationSlug: organization.slug }}
                      />
                    )}
                    nativeButton={false}
                  >
                    Accéder à l’organisation
                    <ArrowRight />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
