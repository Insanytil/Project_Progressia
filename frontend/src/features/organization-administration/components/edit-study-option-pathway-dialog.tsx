import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { StudyOption, StudyOptionPathway } from '../model/study-option.types'
import { useUpdateStudyOptionPathwayMutation } from '../mutations/use-study-option-mutations'
import { StudyOptionCompositionEditor, type StudyOptionCourseDraft } from './study-option-composition-editor'

export function EditStudyOptionPathwayDialog(props: { studyOption: StudyOption; pathway: StudyOptionPathway; organizationId: string; academicYearLabel: string; onClose: () => void }) {
  const mutation = useUpdateStudyOptionPathwayMutation()
  const form = useForm({
    defaultValues: {
      name: props.pathway.name,
      courses: props.pathway.courses.map((course): StudyOptionCourseDraft => ({ courseId: course.course_id, courseName: course.course_name, courseOptionId: course.course_option_id, weeklyHours: course.weekly_hours })),
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim() || value.courses.length === 0) { toast.error('Le parcours doit avoir un nom et au moins un cours.'); return }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          studyOptionId: props.studyOption.id,
          pathwayId: props.pathway.id,
          input: { academic_year_id: props.studyOption.academic_year_id, name: value.name.trim(), courses: value.courses.map((course) => ({ course_id: course.courseId, course_option_id: course.courseOptionId })) },
        })
        toast.success('Parcours mis à jour.')
        props.onClose()
      } catch { toast.error('Le parcours n’a pas pu être mis à jour.') }
    },
  })
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader><DialogTitle>Modifier le parcours</DialogTitle><DialogDescription>{props.studyOption.name} · {props.academicYearLabel}</DialogDescription></DialogHeader>
          <form.Field name="name">{(field) => <Field><FieldLabel htmlFor={field.name}>Nom du parcours</FieldLabel><Input id={field.name} value={field.state.value} maxLength={160} onChange={(event) => field.handleChange(event.target.value)} /></Field>}</form.Field>
          <form.Subscribe selector={(state) => state.values.courses}>{(courses) => <Field><FieldLabel>Composition du parcours</FieldLabel><StudyOptionCompositionEditor organizationId={props.organizationId} academicYearId={props.studyOption.academic_year_id} value={courses} excludedCourseIds={props.studyOption.courses.map((course) => course.course_id)} onChange={(value) => form.setFieldValue('courses', value)} /></Field>}</form.Subscribe>
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
