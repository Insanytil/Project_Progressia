import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import type { OrganizationMember } from '../model/member.types'
import { useUpdateStudentStudyOptionEnrollmentMutation } from '../mutations/use-curriculum-assignment-mutations'
import { studentStudyOptionEnrollmentQueryOptions } from '../queries/curriculum-assignment-queries'
import { studyOptionsQueryOptions } from '../queries/study-option-queries'

export function ManageStudentEnrollmentDialog(props: { member: OrganizationMember; organizationId: string; academicYearId: string; academicYearLabel: string; onClose: () => void }) {
  const enrollmentQuery = useQuery(studentStudyOptionEnrollmentQueryOptions(props.organizationId, props.member.id, props.academicYearId))
  const optionsQuery = useQuery({
    ...studyOptionsQueryOptions(props.organizationId, { page: 1, pageSize: 100, academicYearId: props.academicYearId }),
    placeholderData: undefined,
  })
  const mutation = useUpdateStudentStudyOptionEnrollmentMutation()
  const form = useForm({
    defaultValues: { studyOptionId: '', pathwayId: '' },
    onSubmit: async ({ value }) => {
      const selectedOption = optionsQuery.data?.items.find((item) => item.id === value.studyOptionId)
      if (!selectedOption || (selectedOption.pathways.length > 0 && !value.pathwayId)) { toast.error('Sélectionnez une option et son parcours.'); return }
      try {
        await mutation.mutateAsync({ organizationId: props.organizationId, studentId: props.member.id, input: { academic_year_id: props.academicYearId, study_option_id: value.studyOptionId, pathway_id: value.pathwayId || null } })
        toast.success('Inscription annuelle mise à jour.')
        props.onClose()
      } catch { toast.error('L’inscription n’a pas pu être mise à jour.') }
    },
  })
  useEffect(() => {
    if (enrollmentQuery.data) {
      form.setFieldValue('studyOptionId', enrollmentQuery.data.study_option_id)
      form.setFieldValue('pathwayId', enrollmentQuery.data.pathway_id ?? '')
    }
  }, [enrollmentQuery.data, form])
  const isLoading = enrollmentQuery.isPending || optionsQuery.isPending
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="sm:max-w-xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader><DialogTitle>Option de {props.member.email}</DialogTitle><DialogDescription>Inscription pédagogique pour {props.academicYearLabel}. La classe de l’élève reste indépendante.</DialogDescription></DialogHeader>
          {isLoading ? <div className="space-y-3"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div> : (
            <form.Subscribe selector={(state) => state.values}>
              {(values) => {
                const selectedOption = optionsQuery.data?.items.find((item) => item.id === values.studyOptionId)
                const selectedPathway = selectedOption?.pathways.find((item) => item.id === values.pathwayId)
                return <div className="space-y-4">
                  <Field><FieldLabel>Option principale</FieldLabel><Select value={values.studyOptionId} onValueChange={(value) => { form.setFieldValue('studyOptionId', String(value)); form.setFieldValue('pathwayId', '') }}><SelectTrigger className="w-full"><SelectValue placeholder="Choisir une option" /></SelectTrigger><SelectContent>{optionsQuery.data?.items.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field>
                  {selectedOption && selectedOption.pathways.length > 0 && <Field><FieldLabel>Parcours</FieldLabel><Select value={values.pathwayId} onValueChange={(value) => form.setFieldValue('pathwayId', String(value))}><SelectTrigger className="w-full"><SelectValue placeholder="Choisir un parcours" /></SelectTrigger><SelectContent>{selectedOption.pathways.map((pathway) => <SelectItem key={pathway.id} value={pathway.id}>{pathway.name}</SelectItem>)}</SelectContent></Select></Field>}
                  {selectedOption && <div className="rounded-lg border bg-muted/30 p-3"><p className="mb-2 text-sm font-medium">Cours suivis</p><div className="flex flex-wrap gap-1.5">{selectedOption.courses.map((course) => <Badge key={`common-${course.course_id}`} variant="secondary">{course.course_name} · {course.weekly_hours} h</Badge>)}{selectedPathway?.courses.map((course) => <Badge key={`path-${course.course_id}`} variant="outline">{course.course_name} · {course.weekly_hours} h</Badge>)}</div><p className="mt-2 text-sm font-medium">Total : {Number(selectedOption.total_weekly_hours) + Number(selectedPathway?.weekly_hours ?? 0)} h / semaine</p></div>}
                </div>
              }}
            </form.Subscribe>
          )}
          {(enrollmentQuery.isError || optionsQuery.isError) && <p className="text-sm text-destructive">Les options n’ont pas pu être chargées.</p>}
          {!isLoading && optionsQuery.data?.items.length === 0 && <p className="text-sm text-muted-foreground">Créez d’abord une option pour cette année.</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button><Button type="submit" disabled={isLoading || optionsQuery.isError || enrollmentQuery.isError || optionsQuery.data?.items.length === 0 || mutation.isPending}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
