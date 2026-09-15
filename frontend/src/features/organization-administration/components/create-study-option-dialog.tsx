import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useCreateStudyOptionMutation } from '../mutations/use-study-option-mutations'
import { StudyOptionCompositionEditor, type StudyOptionCourseDraft } from './study-option-composition-editor'

export function CreateStudyOptionDialog(props: {
  open: boolean
  organizationId: string
  academicYearId: string
  academicYearLabel: string
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useCreateStudyOptionMutation()
  const form = useForm({
    defaultValues: { name: '', courses: [] as StudyOptionCourseDraft[] },
    onSubmit: async ({ value }) => {
      if (value.courses.length === 0) {
        toast.error('Ajoutez au moins un cours à cette option.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          input: {
            name: value.name.trim(),
            academic_year_id: props.academicYearId,
            courses: value.courses.map((item) => ({ course_id: item.courseId, course_option_id: item.courseOptionId })),
          },
        })
        toast.success('Option créée.')
        handleOpenChange(false)
      } catch {
        toast.error('Cette option existe déjà ou sa composition est invalide.')
      }
    },
  })

  function handleOpenChange(open: boolean) {
    if (!open) { form.reset(); mutation.reset() }
    props.onOpenChange(open)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader><DialogTitle>Créer une option</DialogTitle><DialogDescription>Composez l’option pour l’année {props.academicYearLabel} avec un seul horaire par cours.</DialogDescription></DialogHeader>
          <FieldGroup>
            <form.Field name="name" validators={{ onSubmit: ({ value }) => value.trim() ? undefined : 'Le nom est obligatoire.' }}>
              {(field) => <Field data-invalid={Boolean(field.state.meta.errors[0])}><FieldLabel htmlFor={field.name}>Nom de l’option</FieldLabel><Input id={field.name} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} placeholder="Sciences fortes" maxLength={120} /><FieldError>{field.state.meta.errors[0]}</FieldError></Field>}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.courses}>
              {(courses) => <Field><FieldLabel>Composition</FieldLabel><StudyOptionCompositionEditor organizationId={props.organizationId} academicYearId={props.academicYearId} value={courses} onChange={(value) => form.setFieldValue('courses', value)} /></Field>}
            </form.Subscribe>
          </FieldGroup>
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => handleOpenChange(false)}>Annuler</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Créer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
