import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type MembershipRole = 'organization_admin' | 'teacher' | 'student'

const roles: Array<{ value: MembershipRole; label: string }> = [
  { value: 'organization_admin', label: 'Administrateur' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'student', label: 'Étudiant' },
]

type MembershipAccessDialogProps = {
  title: string
  description: string
  role: MembershipRole
  isActive: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (changes: { role: MembershipRole; isActive: boolean }) => Promise<void>
}

export function MembershipAccessDialog({
  title,
  description,
  role,
  isActive,
  isPending,
  onClose,
  onSubmit,
}: MembershipAccessDialogProps) {
  const form = useForm({
    defaultValues: { role, status: isActive ? 'active' : 'inactive' },
    onSubmit: async ({ value }) => {
      await onSubmit({ role: value.role, isActive: value.status === 'active' })
    },
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field name="role">
              {(field) => (
                <Field>
                  <FieldLabel>Rôle</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as MembershipRole)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{roles.find((item) => item.value === field.state.value)?.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel>Accès à l’organisation</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{field.state.value === 'active' ? 'Actif' : 'Désactivé'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Désactivé</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircle className="animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
