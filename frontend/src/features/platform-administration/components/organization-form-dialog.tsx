import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { getOrganizationMutationError } from '../api/organization-errors'
import { useCreateOrganizationMutation, useUpdateOrganizationMutation } from '../mutations/use-organization-mutations'
import type { Organization } from '../model/organization.types'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type OrganizationFormDialogProps = {
  open: boolean
  organization?: Organization
  onOpenChange: (open: boolean) => void
}

export function OrganizationFormDialog({
  open,
  organization,
  onOpenChange,
}: OrganizationFormDialogProps) {
  const createMutation = useCreateOrganizationMutation()
  const updateMutation = useUpdateOrganizationMutation()
  const isEditing = Boolean(organization)
  const activeMutation = isEditing ? updateMutation : createMutation
  const form = useForm({
    defaultValues: {
      name: organization?.name ?? '',
      slug: organization?.slug ?? '',
      isActive: organization?.is_active ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        if (organization) {
          await updateMutation.mutateAsync({
            organizationId: organization.id,
            input: { name: value.name.trim(), slug: value.slug, is_active: value.isActive },
          })
          toast.success('Organisation mise à jour.')
        } else {
          await createMutation.mutateAsync({ name: value.name.trim(), slug: value.slug })
          toast.success('Organisation créée.')
        }

        onOpenChange(false)
      } catch {
        // The mutation error is displayed inside the dialog.
      }
    },
  })

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset()
      createMutation.reset()
      updateMutation.reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier l’organisation' : 'Créer une organisation'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modifiez les informations ou le statut de cette organisation.'
                : 'Renseignez le nom et le slug de la nouvelle organisation.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) => value.trim() ? undefined : 'Le nom est obligatoire.',
                onSubmit: ({ value }) => value.trim() ? undefined : 'Le nom est obligatoire.',
              }}
            >
              {(field) => (
                <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                  <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Progressia Academy"
                    aria-invalid={Boolean(field.state.meta.errors[0])}
                  />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </Field>
              )}
            </form.Field>

            <form.Field
              name="slug"
              validators={{
                onBlur: ({ value }) => slugPattern.test(value) ? undefined : 'Utilisez des minuscules, chiffres et tirets.',
                onSubmit: ({ value }) => slugPattern.test(value) ? undefined : 'Utilisez des minuscules, chiffres et tirets.',
              }}
            >
              {(field) => (
                <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                  <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value.toLowerCase())}
                    placeholder="progressia-academy"
                    aria-invalid={Boolean(field.state.meta.errors[0])}
                  />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </Field>
              )}
            </form.Field>

            {isEditing && (
              <form.Field name="isActive">
                {(field) => (
                  <Field orientation="horizontal" className="items-center justify-between rounded-xl border p-3">
                    <div>
                      <FieldLabel htmlFor={field.name}>Organisation active</FieldLabel>
                      <p className="mt-1 text-xs text-muted-foreground">Autorise l’utilisation de cette organisation.</p>
                    </div>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                  </Field>
                )}
              </form.Field>
            )}
          </FieldGroup>

          {activeMutation.isError && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {getOrganizationMutationError(activeMutation.error)}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={activeMutation.isPending}>
              {activeMutation.isPending && <LoaderCircle className="animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer l’organisation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
