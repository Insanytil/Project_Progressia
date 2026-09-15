import { useForm } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateAcademicYearMutation } from '../mutations/use-academic-year-mutations'

function currentStartYear(): number {
  const now = new Date()
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
}

const years = Array.from(
  { length: 22 },
  (_, index) => String(currentStartYear() + 11 - index),
)

export function CreateAcademicYearDialog(props: {
  open: boolean
  organizationId: string
  onOpenChange: (open: boolean) => void
}) {
  const mutation = useCreateAcademicYearMutation()
  const form = useForm({
    defaultValues: {
      startYear: String(currentStartYear()),
      endYear: String(currentStartYear() + 1),
    },
    onSubmit: async ({ value }) => {
      if (Number(value.endYear) !== Number(value.startYear) + 1) {
        toast.error('Les deux années doivent être consécutives.')
        return
      }
      try {
        await mutation.mutateAsync({
          organizationId: props.organizationId,
          startYear: Number(value.startYear),
          endYear: Number(value.endYear),
        })
        toast.success('Année scolaire créée.')
        handleOpenChange(false)
      } catch {
        toast.error('Cette année scolaire existe déjà ou n’a pas pu être créée.')
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
      <DialogContent className="sm:max-w-md">
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}>
          <DialogHeader>
            <DialogTitle>Nouvelle année scolaire</DialogTitle>
            <DialogDescription>Créez une période composée de deux années consécutives.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="grid grid-cols-2 gap-3">
            <form.Field name="startYear">
              {(field) => (
                <Field>
                  <FieldLabel>Année de début</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => {
                    const startYear = String(value)
                    field.handleChange(startYear)
                    form.setFieldValue('endYear', String(Number(startYear) + 1))
                  }}>
                    <SelectTrigger className="w-full"><SelectValue>{field.state.value}</SelectValue></SelectTrigger>
                    <SelectContent>{years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
            <form.Field name="endYear">
              {(field) => (
                <Field>
                  <FieldLabel>Année de fin</FieldLabel>
                  <Select value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                    <SelectTrigger className="w-full"><SelectValue>{field.state.value}</SelectValue></SelectTrigger>
                    <SelectContent>{years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
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
