import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'

import type { OrganizationMember } from '../model/member.types'
import { useUpdateTeacherCourseAuthorizationsMutation } from '../mutations/use-curriculum-assignment-mutations'
import { studyOptionCourseChoicesQueryOptions } from '../queries/study-option-queries'
import { teacherCourseAuthorizationsQueryOptions } from '../queries/curriculum-assignment-queries'
import { CourseAuthorizationMultiSelect } from './course-authorization-multi-select'

export function ManageTeacherAuthorizationsDialog(props: { member: OrganizationMember; organizationId: string; academicYearId: string; academicYearLabel: string; onClose: () => void }) {
  const [courseIds, setCourseIds] = useState<string[]>([])
  const authorizationsQuery = useQuery(teacherCourseAuthorizationsQueryOptions(props.organizationId, props.member.id, props.academicYearId))
  const coursesQuery = useQuery({
    ...studyOptionCourseChoicesQueryOptions(props.organizationId, props.academicYearId),
    placeholderData: undefined,
  })
  const mutation = useUpdateTeacherCourseAuthorizationsMutation()
  useEffect(() => { if (authorizationsQuery.data) setCourseIds(authorizationsQuery.data.courses.map((course) => course.course_id)) }, [authorizationsQuery.data])
  async function submit() {
    try {
      await mutation.mutateAsync({ organizationId: props.organizationId, teacherId: props.member.id, academicYearId: props.academicYearId, courseIds })
      toast.success('Habilitations mises à jour.')
      props.onClose()
    } catch { toast.error('Les habilitations n’ont pas pu être mises à jour.') }
  }
  const isLoading = authorizationsQuery.isPending || coursesQuery.isPending
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Cours de {props.member.email}</DialogTitle><DialogDescription>Choisissez les cours que cet enseignant peut exercer en {props.academicYearLabel}.</DialogDescription></DialogHeader>
        <Field><FieldLabel>Cours autorisés</FieldLabel>{isLoading ? <Skeleton className="h-9 w-full" /> : <CourseAuthorizationMultiSelect courses={(coursesQuery.data?.items ?? []).filter((course) => course.options.length > 0)} value={courseIds} onChange={setCourseIds} />}</Field>
        {(authorizationsQuery.isError || coursesQuery.isError) && <p className="text-sm text-destructive">Les données nécessaires n’ont pas pu être chargées.</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={props.onClose}>Annuler</Button><Button disabled={isLoading || authorizationsQuery.isError || coursesQuery.isError || mutation.isPending} onClick={() => void submit()}>{mutation.isPending && <LoaderCircle className="animate-spin" />}Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
