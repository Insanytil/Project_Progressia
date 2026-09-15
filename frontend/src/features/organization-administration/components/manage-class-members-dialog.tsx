import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

import { getClassMutationError } from '../api/class-errors'
import type { SchoolClass, SchoolClassMemberOption } from '../model/class.types'
import { useUpdateSchoolClassMembersMutation } from '../mutations/use-class-mutations'
import { ClassMemberMultiSelect } from './class-member-multi-select'

export function ManageClassMembersDialog(props: {
  schoolClass: SchoolClass
  organizationId: string
  onClose: () => void
}) {
  const mutation = useUpdateSchoolClassMembersMutation()
  const form = useForm({
    defaultValues: {
      teachers: props.schoolClass.teachers as SchoolClassMemberOption[],
      students: props.schoolClass.students as SchoolClassMemberOption[],
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          schoolClassId: props.schoolClass.id,
          input: {
            teacher_ids: value.teachers.map((member) => member.id),
            student_ids: value.students.map((member) => member.id),
          },
        })
        toast.success('Membres de la classe mis à jour.')
        props.onClose()
      } catch (error) {
        toast.error(getClassMutationError(error))
      }
    },
  })

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) props.onClose() }}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Gérer les membres de {props.schoolClass.name}</DialogTitle>
            <DialogDescription>Ajoutez ou retirez les professeurs titulaires et les élèves pour l’année {props.schoolClass.academic_year}.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <form.Field name="teachers">
              {(field) => (
                <Field>
                  <FieldLabel>Professeurs titulaires</FieldLabel>
                  <ClassMemberMultiSelect organizationId={props.organizationId} role="teacher" value={field.state.value} onChange={field.handleChange} placeholder="Sélectionner des professeurs" />
                </Field>
              )}
            </form.Field>
            <form.Field name="students">
              {(field) => (
                <Field>
                  <FieldLabel>Élèves</FieldLabel>
                  <ClassMemberMultiSelect organizationId={props.organizationId} role="student" value={field.state.value} onChange={field.handleChange} placeholder="Sélectionner des élèves" academicYear={props.schoolClass.academic_year} schoolClassId={props.schoolClass.id} />
                </Field>
              )}
            </form.Field>
          </FieldGroup>
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
