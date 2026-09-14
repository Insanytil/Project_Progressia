import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { Organization } from '../model/organization.types'
import type { OrganizationRole, PlatformUser } from '../model/user.types'
import { useAddUserToOrganizationMutation } from '../mutations/use-user-mutations'

const roles: Array<{ value: OrganizationRole; label: string }> = [
  { value: 'organization_admin', label: 'Administrateur' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Étudiant' },
]

type AddUserToOrganizationDialogProps = {
  user: PlatformUser | null
  organizations: Organization[]
  onOpenChange: (open: boolean) => void
}

export function AddUserToOrganizationDialog({
  user,
  organizations,
  onOpenChange,
}: AddUserToOrganizationDialogProps) {
  const mutation = useAddUserToOrganizationMutation()
  const availableOrganizations = organizations.filter(
    (organization) => !user?.memberships.some(
      (membership) => membership.organization_id === organization.id,
    ),
  )
  const form = useForm({
    defaultValues: {
      organizationId: 'none',
      role: 'student' as OrganizationRole,
    },
    onSubmit: async ({ value }) => {
      if (!user || value.organizationId === 'none') return
      try {
        await mutation.mutateAsync({
          userId: user.id,
          organizationId: value.organizationId,
          role: value.role,
        })
        toast.success(`${user.email} a été ajouté à l’organisation.`)
        handleOpenChange(false)
      } catch {
        toast.error('L’utilisateur n’a pas pu être ajouté à cette organisation.')
      }
    },
  })

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset()
      mutation.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={Boolean(user)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Ajouter à une organisation</DialogTitle>
            <DialogDescription>
              Choisissez un accès pour {user?.email} sans modifier ses autres appartenances.
            </DialogDescription>
          </DialogHeader>

          {availableOrganizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cet utilisateur appartient déjà à toutes les organisations disponibles.
            </p>
          ) : (
            <FieldGroup>
              <form.Field name="organizationId" validators={{
                onSubmit: ({ value }) => value === 'none' ? 'Sélectionnez une organisation.' : undefined,
              }}>
                {(field) => (
                  <Field>
                    <FieldLabel>Organisation</FieldLabel>
                    <Select value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {availableOrganizations.find(
                            (organization) => organization.id === field.state.value,
                          )?.name ?? 'Sélectionner une organisation'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrganizations.map((organization) => (
                          <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  </Field>
                )}
              </form.Field>
              <form.Field name="role">
                {(field) => (
                  <Field>
                    <FieldLabel>Rôle</FieldLabel>
                    <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as OrganizationRole)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{roles.find((role) => role.value === field.state.value)?.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={availableOrganizations.length === 0 || mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
