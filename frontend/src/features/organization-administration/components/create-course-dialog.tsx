import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useCreateCourseMutation } from '../mutations/use-course-mutations'
import { CourseOptionEditor } from './course-option-editor'

function normalizedOptions(values: string[]): number[] | null {
  const options = values.map(Number)
  if (options.some((value) => !Number.isFinite(value) || value <= 0 || value > 99 || !Number.isInteger(value * 2))) return null
  if (new Set(options).size !== options.length) return null
  return options
}

export function CreateCourseDialog(props: {
  open: boolean
  organizationId: string
  academicYearId: string
  academicYearLabel: string
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useCreateCourseMutation()
  const form = useForm({
    defaultValues: { name: '', options: [''] },
    onSubmit: async ({ value }) => {
      const options = normalizedOptions(value.options)
      if (!options) {
        toast.error('Chaque horaire doit être unique et compris entre 0,5 et 99 heures.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          input: {
            name: value.name.trim(),
            academic_year_id: props.academicYearId,
            options,
          },
        })
        toast.success('Cours créé.')
        handleOpenChange(false)
      } catch {
        toast.error('Ce cours existe déjà ou les informations sont invalides.')
      }
    },
  })

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset()
      mutation.reset()
    }
    props.onOpenChange(open)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Créer un cours</DialogTitle>
            <DialogDescription>Les horaires saisis seront disponibles uniquement pour {props.academicYearLabel}.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field name="name" validators={{
              onBlur: ({ value }) => value.trim() ? undefined : 'Le nom du cours est obligatoire.',
              onSubmit: ({ value }) => value.trim() ? undefined : 'Le nom du cours est obligatoire.',
            }}>
              {(field) => (
                <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                  <FieldLabel htmlFor={field.name}>Nom du cours</FieldLabel>
                  <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="Mathématiques" maxLength={120} />
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.options}>
              {(options) => (
                <Field>
                  <FieldLabel>Horaires hebdomadaires en {props.academicYearLabel}</FieldLabel>
                  <CourseOptionEditor values={options} onChange={(values) => form.setFieldValue('options', values)} />
                </Field>
              )}
            </form.Subscribe>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => handleOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
