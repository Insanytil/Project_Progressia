import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'

import type { StudyOption } from '../model/study-option.types'
import { useUpdateStudyOptionCoursesMutation } from '../mutations/use-study-option-mutations'
import { StudyOptionCompositionEditor, type StudyOptionCourseDraft } from './study-option-composition-editor'

export function ManageStudyOptionDialog(props: { studyOption: StudyOption; organizationId: string; academicYearLabel: string; onClose: () => void }) {
  const mutation = useUpdateStudyOptionCoursesMutation()
  const form = useForm({
    defaultValues: { courses: props.studyOption.courses.map((item): StudyOptionCourseDraft => ({ courseId: item.course_id, courseName: item.course_name, courseOptionId: item.course_option_id, weeklyHours: item.weekly_hours })) },
    onSubmit: async ({ value }) => {
      if (value.courses.length === 0) { toast.error('Une option doit contenir au moins un cours.'); return }
      try {
        await mutation.mutateAsync({ organizationId: props.organizationId, studyOptionId: props.studyOption.id, input: { academic_year_id: props.studyOption.academic_year_id, courses: value.courses.map((item) => ({ course_id: item.courseId, course_option_id: item.courseOptionId })) } })
        toast.success('Composition mise à jour.')
        props.onClose()
      } catch { toast.error('La composition n’a pas pu être mise à jour.') }
    },
  })
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader><DialogTitle>Composition de {props.studyOption.name}</DialogTitle><DialogDescription>Modifiez les cours et horaires pour {props.academicYearLabel}.</DialogDescription></DialogHeader>
          <form.Subscribe selector={(state) => state.values.courses}>{(courses) => <Field><FieldLabel>Composition</FieldLabel><StudyOptionCompositionEditor organizationId={props.organizationId} academicYearId={props.studyOption.academic_year_id} value={courses} onChange={(value) => form.setFieldValue('courses', value)} /></Field>}</form.Subscribe>
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
