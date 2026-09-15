import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'

import type { Course } from '../model/course.types'
import { useUpdateCourseOptionsMutation } from '../mutations/use-course-mutations'
import { CourseOptionEditor } from './course-option-editor'

export function ManageCourseOptionsDialog(props: {
  course: Course
  organizationId: string
  academicYearId: string
  academicYearLabel: string
  onClose: () => void
}) {
  const mutation = useUpdateCourseOptionsMutation()
  const form = useForm({
    defaultValues: { options: props.course.options.map((option) => String(option.weekly_hours)) },
    onSubmit: async ({ value }) => {
      const options = value.options.map(Number)
      if (options.some((option) => !Number.isFinite(option) || option <= 0 || option > 99 || !Number.isInteger(option * 2)) || new Set(options).size !== options.length) {
        toast.error('Chaque horaire doit être unique et compris entre 0,5 et 99 heures.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          courseId: props.course.id,
          input: { academic_year_id: props.academicYearId, options },
        })
        toast.success('Options du cours mises à jour.')
        props.onClose()
      } catch {
        toast.error('Les horaires n’ont pas pu être mis à jour. Un horaire utilisé dans une option d’organisation ne peut pas être supprimé.')
      }
    },
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Horaires de {props.course.name}</DialogTitle>
            <DialogDescription>Ces horaires concernent uniquement l’année {props.academicYearLabel}. Une liste vide signifie que le cours n’a aucun horaire cette année-là.</DialogDescription>
          </DialogHeader>
          <form.Subscribe selector={(state) => state.values.options}>
            {(options) => (
              <Field>
                <FieldLabel>Heures par semaine</FieldLabel>
                <CourseOptionEditor values={options} allowEmpty onChange={(values) => form.setFieldValue('options', values)} />
              </Field>
            )}
          </form.Subscribe>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
