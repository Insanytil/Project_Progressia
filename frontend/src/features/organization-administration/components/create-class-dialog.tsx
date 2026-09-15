import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { getClassMutationError } from '../api/class-errors'
import {
  formatAcademicYear,
  getAcademicYearOptions,
  getCurrentAcademicYearStart,
  isConsecutiveAcademicYear,
} from '../model/academic-year'
import type { SchoolClassMemberOption } from '../model/class.types'
import { useCreateSchoolClassMutation } from '../mutations/use-class-mutations'
import { ClassMemberMultiSelect } from './class-member-multi-select'
import { YearSelect } from './year-select'

const yearOptions = getAcademicYearOptions()
const defaultStartYear = String(getCurrentAcademicYearStart())
const defaultEndYear = String(getCurrentAcademicYearStart() + 1)

export function CreateClassDialog(props: {
  open: boolean
  organizationId: string
  defaultAcademicYear?: { startYear: number; endYear: number }
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useCreateSchoolClassMutation()
  const form = useForm({
    defaultValues: {
      name: '',
      startYear: String(props.defaultAcademicYear?.startYear ?? defaultStartYear),
      endYear: String(props.defaultAcademicYear?.endYear ?? defaultEndYear),
      teachers: [] as SchoolClassMemberOption[],
      students: [] as SchoolClassMemberOption[],
    },
    onSubmit: async ({ value }) => {
      if (!isConsecutiveAcademicYear(value.startYear, value.endYear)) {
        toast.error('Les deux années doivent être consécutives.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          input: {
            name: value.name.trim(),
            academic_year: formatAcademicYear(value.startYear, value.endYear),
            teacher_ids: value.teachers.map((member) => member.id),
            student_ids: value.students.map((member) => member.id),
          },
        })
        toast.success('Classe créée.')
        handleOpenChange(false)
      } catch (error) {
        toast.error(getClassMutationError(error))
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
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <form className="grid gap-5" noValidate onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Créer une classe</DialogTitle>
            <DialogDescription>Définissez l’année scolaire, puis rattachez les professeurs titulaires et les élèves.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="name" validators={{
                onBlur: ({ value }) => value.trim() ? undefined : 'Le nom de la classe est obligatoire.',
                onSubmit: ({ value }) => value.trim() ? undefined : 'Le nom de la classe est obligatoire.',
              }}>
                {(field) => (
                  <Field data-invalid={Boolean(field.state.meta.errors[0])}>
                    <FieldLabel htmlFor={field.name}>Nom</FieldLabel>
                    <Input id={field.name} value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} placeholder="4B" maxLength={120} />
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  </Field>
                )}
              </form.Field>
              <div className="grid grid-cols-2 gap-2">
                <form.Field name="startYear">
                  {(field) => (
                    <Field>
                      <FieldLabel>Année de début</FieldLabel>
                      <YearSelect
                        value={field.state.value}
                        years={yearOptions}
                        onValueChange={(value) => {
                          field.handleChange(value)
                          form.setFieldValue('endYear', String(Number(value) + 1))
                        }}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="endYear">
                  {(field) => (
                    <Field>
                      <FieldLabel>Année de fin</FieldLabel>
                      <YearSelect value={field.state.value} years={yearOptions} onValueChange={field.handleChange} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </div>
            <form.Field name="teachers">
              {(field) => (
                <Field>
                  <FieldLabel>Professeurs titulaires</FieldLabel>
                  <ClassMemberMultiSelect organizationId={props.organizationId} role="teacher" value={field.state.value} onChange={field.handleChange} placeholder="Sélectionner des professeurs" enabled={props.open} />
                </Field>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => [state.values.startYear, state.values.endYear] as const}>
              {([startYear, endYear]) => (
                <form.Field name="students">
                  {(field) => (
                    <Field>
                      <FieldLabel>Élèves</FieldLabel>
                      <ClassMemberMultiSelect organizationId={props.organizationId} role="student" value={field.state.value} onChange={field.handleChange} placeholder="Sélectionner des élèves" enabled={props.open} academicYear={formatAcademicYear(startYear, endYear)} />
                    </Field>
                  )}
                </form.Field>
              )}
            </form.Subscribe>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="animate-spin" />}
              Créer la classe
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
