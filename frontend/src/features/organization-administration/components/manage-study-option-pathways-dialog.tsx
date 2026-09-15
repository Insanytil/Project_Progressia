import { useForm } from '@tanstack/react-form'
import { LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { StudyOption } from '../model/study-option.types'
import { useUpdateStudyOptionPathwaysMutation } from '../mutations/use-study-option-mutations'
import { StudyOptionCompositionEditor, type StudyOptionCourseDraft } from './study-option-composition-editor'

type PathwayDraft = {
  clientId: string
  id?: string
  name: string
  courses: StudyOptionCourseDraft[]
}

export function ManageStudyOptionPathwaysDialog(props: {
  studyOption: StudyOption
  organizationId: string
  academicYearLabel: string
  onClose: () => void
}) {
  const mutation = useUpdateStudyOptionPathwaysMutation()
  const form = useForm({
    defaultValues: {
      pathways: props.studyOption.pathways.map((pathway): PathwayDraft => ({
        clientId: pathway.id,
        id: pathway.id,
        name: pathway.name,
        courses: pathway.courses.map((course) => ({
          courseId: course.course_id,
          courseName: course.course_name,
          courseOptionId: course.course_option_id,
          weeklyHours: course.weekly_hours,
        })),
      })),
    },
    onSubmit: async ({ value }) => {
      const names = value.pathways.map((pathway) => pathway.name.trim().toLocaleLowerCase())
      if (value.pathways.some((pathway) => !pathway.name.trim() || pathway.courses.length === 0)) {
        toast.error('Chaque parcours doit avoir un nom et au moins un cours.')
        return
      }
      if (new Set(names).size !== names.length) {
        toast.error('Les noms des parcours doivent être uniques.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          studyOptionId: props.studyOption.id,
          input: {
            academic_year_id: props.studyOption.academic_year_id,
            pathways: value.pathways.map((pathway) => ({
              id: pathway.id,
              name: pathway.name.trim(),
              courses: pathway.courses.map((course) => ({
                course_id: course.courseId,
                course_option_id: course.courseOptionId,
              })),
            })),
          },
        })
        toast.success('Parcours mis à jour.')
        props.onClose()
      } catch {
        toast.error('Les parcours n’ont pas pu être mis à jour. Vérifiez leur composition.')
      }
    },
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Parcours de {props.studyOption.name}</DialogTitle>
            <DialogDescription>Définissez les combinaisons de cours réellement proposées en {props.academicYearLabel}. Les cours communs ne peuvent pas être répétés.</DialogDescription>
          </DialogHeader>
          <form.Subscribe selector={(state) => state.values.pathways}>
            {(pathways) => (
              <div className="space-y-4">
                {pathways.map((pathway, index) => (
                  <section key={pathway.clientId} className="space-y-4 rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-end gap-2">
                      <Field className="flex-1">
                        <FieldLabel htmlFor={`pathway-${pathway.clientId}`}>Nom du parcours</FieldLabel>
                        <Input id={`pathway-${pathway.clientId}`} value={pathway.name} placeholder="Anglais 4 h · Néerlandais 2 h · Latin 2 h" onChange={(event) => form.setFieldValue('pathways', pathways.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
                      </Field>
                      <Button type="button" variant="ghost" size="icon" onClick={() => form.setFieldValue('pathways', pathways.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 /><span className="sr-only">Supprimer ce parcours</span>
                      </Button>
                    </div>
                    <StudyOptionCompositionEditor
                      organizationId={props.organizationId}
                      academicYearId={props.studyOption.academic_year_id}
                      value={pathway.courses}
                      excludedCourseIds={props.studyOption.courses.map((course) => course.course_id)}
                      onChange={(courses) => form.setFieldValue('pathways', pathways.map((item, itemIndex) => itemIndex === index ? { ...item, courses } : item))}
                    />
                  </section>
                ))}
                <Button type="button" variant="outline" onClick={() => form.setFieldValue('pathways', [...pathways, { clientId: crypto.randomUUID(), name: '', courses: [] }])}>
                  <Plus />Ajouter un parcours
                </Button>
                {pathways.length === 0 && <p className="text-sm text-muted-foreground">Sans parcours, l’option est constituée uniquement de son tronc commun.</p>}
              </div>
            )}
          </form.Subscribe>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
