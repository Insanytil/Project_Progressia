import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useUpdateAccountPreferencesMutation,
  type AuthenticatedUser,
} from '@/features/auth'

type DefaultOrganizationFormProps = {
  user: AuthenticatedUser
}

export function DefaultOrganizationForm({ user }: DefaultOrganizationFormProps) {
  const mutation = useUpdateAccountPreferencesMutation()
  const form = useForm({
    defaultValues: {
      defaultOrganizationId: user.default_organization_id ?? 'automatic',
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          default_organization_id: value.defaultOrganizationId === 'automatic'
            ? null
            : value.defaultOrganizationId,
        })
        toast.success('Organisation par défaut enregistrée.')
      } catch {
        toast.error('La préférence n’a pas pu être enregistrée.')
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation par défaut</CardTitle>
        <CardDescription>
          Cette organisation sera ouverte après votre prochaine connexion. Changer cette
          préférence ne modifie pas l’espace actuellement affiché.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {user.organizations.length > 1 ? (
          <form
            className="grid max-w-xl gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field name="defaultOrganizationId">
                {(field) => (
                  <Field>
                    <FieldLabel>Organisation chargée à la connexion</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(String(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {field.state.value === 'automatic'
                            ? 'Automatique — première organisation disponible'
                            : user.organizations.find(
                                (organization) => organization.id === field.state.value,
                              )?.name ?? 'Organisation indisponible'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">
                          Automatique — première organisation disponible
                        </SelectItem>
                        {user.organizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>
                            {organization.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Un rafraîchissement conserve toujours l’organisation indiquée dans l’URL.
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-fit"
                  disabled={!canSubmit || isSubmitting || mutation.isPending}
                >
                  {(isSubmitting || mutation.isPending) && <LoaderCircle className="animate-spin" />}
                  Enregistrer
                </Button>
              )}
            </form.Subscribe>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {user.organizations.length === 1
              ? `${user.organizations[0].name} est actuellement votre seul espace disponible.`
              : 'Aucune organisation active n’est actuellement associée à votre compte.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
