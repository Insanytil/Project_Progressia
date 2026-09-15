import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { MembershipRole } from '@/features/memberships/components/membership-access-dialog'

import { useCreateOrganizationMemberMutation } from '../mutations/use-member-mutations'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const roles: Array<{ value: MembershipRole; label: string }> = [
  { value: 'organization_admin', label: 'Administrateur' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Étudiant' },
]

type CreateMemberDialogProps = {
  open: boolean
  organizationId: string
  organizationName: string
  onOpenChange: (open: boolean) => void
}

export function CreateMemberDialog({ open, organizationId, organizationName, onOpenChange }: CreateMemberDialogProps) {
  const mutation = useCreateOrganizationMemberMutation()
  const form = useForm({
    defaultValues: { email: '', role: 'student' as MembershipRole },
    onSubmit: async ({ value }) => {
      try {
        const result = await mutation.mutateAsync({
          organizationId,
          email: value.email.trim().toLowerCase(),
          role: value.role,
        })
        result.invitation_queued
          ? toast.success('Compte créé et invitation mise en file d’attente.')
          : toast.warning('Compte créé, mais Redis est indisponible. L’invitation n’a pas été mise en file.')
        handleOpenChange(false)
      } catch {
        toast.error('Ce compte existe déjà ou les informations sont invalides.')
      }
    },
  })

  function handleOpenChange(nextOpen: boolean) {
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
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>Le compte sera directement rattaché à {organizationName} et recevra une invitation.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field name="email" validators={{
              onBlur: ({ value }) => emailPattern.test(value.trim()) ? undefined : 'Saisissez une adresse e-mail valide.',
              onSubmit: ({ value }) => emailPattern.test(value.trim()) ? undefined : 'Saisissez une adresse e-mail valide.',
            }}>
              {(field) => (
                <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                  <FieldLabel htmlFor={field.name}>Adresse e-mail</FieldLabel>
                  <Input id={field.name} type="email" autoComplete="off" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </Field>
              )}
            </form.Field>
            <form.Field name="role">
              {(field) => (
                <Field>
                  <FieldLabel>Rôle dans l’organisation</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as MembershipRole)}>
                    <SelectTrigger className="w-full"><SelectValue>{roles.find((role) => role.value === field.state.value)?.label}</SelectValue></SelectTrigger>
                    <SelectContent>{roles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
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
