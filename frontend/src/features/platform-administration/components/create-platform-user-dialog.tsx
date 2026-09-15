import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreatePlatformUserMutation } from '../mutations/use-user-mutations'
import type { OrganizationRole } from '../model/user.types'
import { useOrganizationOptions } from '../hooks/use-organization-options'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const roles: Array<{ value: OrganizationRole; label: string }> = [
  { value: 'organization_admin', label: 'Administrateur' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Étudiant' },
]

type CreatePlatformUserDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePlatformUserDialog({ open, onOpenChange }: CreatePlatformUserDialogProps) {
  const mutation = useCreatePlatformUserMutation()
  const organizationOptions = useOrganizationOptions()
  const form = useForm({
    defaultValues: {
      email: '',
      organizationId: 'none',
      role: 'student' as OrganizationRole,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await mutation.mutateAsync({
          email: value.email.trim().toLowerCase(),
          organization_id: value.organizationId === 'none' ? null : value.organizationId,
          role: value.organizationId === 'none' ? null : value.role,
        })
        if (result.invitation_queued) {
          toast.success('Compte créé et invitation mise en file d’attente.')
        } else {
          toast.warning('Compte créé, mais Redis est indisponible. L’invitation n’a pas été mise en file.')
        }
        form.reset()
        onOpenChange(false)
      } catch {
        // The mutation state is rendered below.
      }
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
      mutation.reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-5" noValidate onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Créer un compte utilisateur</DialogTitle>
            <DialogDescription>
              Un lien sécurisé sera envoyé afin que l’utilisateur définisse son mot de passe.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field
              name="email"
              validators={{
                onBlur: ({ value }) => emailPattern.test(value) ? undefined : 'Saisissez une adresse e-mail valide.',
                onSubmit: ({ value }) => emailPattern.test(value) ? undefined : 'Saisissez une adresse e-mail valide.',
              }}
            >
              {(field) => (
                <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                  <FieldLabel htmlFor={field.name}>Adresse e-mail</FieldLabel>
                  <Input id={field.name} type="email" autoComplete="off" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} aria-invalid={Boolean(field.state.meta.errors[0])} />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </Field>
              )}
            </form.Field>
            <form.Field name="organizationId">
              {(field) => (
                <Field>
                  <FieldLabel>Organisation facultative</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {field.state.value === 'none'
                          ? 'Aucune organisation'
                          : organizationOptions.organizations.find(
                              (organization) => organization.id === field.state.value,
                            )?.name ?? 'Organisation inconnue'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune organisation</SelectItem>
                      {organizationOptions.organizations.map((organization) => (
                        <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.organizationId}>
              {(organizationId) => organizationId !== 'none' && (
                <form.Field name="role">
                  {(field) => (
                    <Field>
                      <FieldLabel>Rôle dans l’organisation</FieldLabel>
                      <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as OrganizationRole)}>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {roles.find((role) => role.value === field.state.value)?.label}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
              )}
            </form.Subscribe>
          </FieldGroup>
          {mutation.isError && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {mutation.error && 'Ce compte existe déjà ou les informations sont invalides.'}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              Créer et inviter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
