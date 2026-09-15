import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { FileSpreadsheet, LoaderCircle, Users } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import {
  useConfirmMemberImportMutation,
  usePreviewMemberImportFileMutation,
  usePreviewMemberImportMutation,
} from '../mutations/use-member-import-mutations'
import type {
  BulkMemberRole,
  MemberImportPreview,
  MemberImportTarget,
} from '../model/member-import.types'

type OrganizationOption = { id: string; name: string }

type MemberImportDialogProps = {
  open: boolean
  mode: 'organization' | 'platform'
  organization?: OrganizationOption
  organizations?: OrganizationOption[]
  onOpenChange: (open: boolean) => void
  onCompleted: () => void
}

const roleLabels: Record<BulkMemberRole, string> = {
  teacher: 'Enseignants',
  student: 'Étudiants',
}

function splitEmails(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((email) => email.trim())
    .filter(Boolean)
}

export function MemberImportDialog({
  open,
  mode,
  organization,
  organizations = [],
  onOpenChange,
  onCompleted,
}: MemberImportDialogProps) {
  const [source, setSource] = useState<'manual' | 'excel'>('manual')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<MemberImportPreview | null>(null)
  const previewMutation = usePreviewMemberImportMutation()
  const filePreviewMutation = usePreviewMemberImportFileMutation()
  const confirmMutation = useConfirmMemberImportMutation()
  const form = useForm({
    defaultValues: {
      organizationId: organization?.id ?? '',
      role: 'student' as BulkMemberRole,
      emails: '',
    },
    onSubmit: async ({ value }) => {
      const target = getTarget(value.organizationId)
      if (!target) {
        toast.error('Sélectionnez une organisation.')
        return
      }
      try {
        const result = source === 'excel'
          ? file && await filePreviewMutation.mutateAsync({ target, role: value.role, file })
          : await previewMutation.mutateAsync({
              target,
              role: value.role,
              emails: splitEmails(value.emails),
            })
        if (result) setPreview(result)
      } catch {
        toast.error('Le fichier ou les adresses n’ont pas pu être analysés.')
      }
    },
  })

  function getTarget(organizationId: string): MemberImportTarget | null {
    const id = mode === 'organization' ? organization?.id : organizationId
    if (!id) return null
    return mode === 'platform'
      ? { kind: 'platform', organizationId: id }
      : { kind: 'organization', organizationId: id }
  }

  function reset() {
    form.reset()
    setSource('manual')
    setFile(null)
    setPreview(null)
    previewMutation.reset()
    filePreviewMutation.reset()
    confirmMutation.reset()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  async function confirm() {
    const values = form.state.values
    const target = getTarget(values.organizationId)
    if (!target || !preview?.can_confirm) return
    try {
      const result = await confirmMutation.mutateAsync({
        target,
        role: values.role,
        emails: preview.rows.map((row) => row.email),
      })
      toast.success(
        `${result.created} compte${result.created > 1 ? 's' : ''} créé${result.created > 1 ? 's' : ''}, ${result.invitations_queued} invitation${result.invitations_queued > 1 ? 's' : ''} mise${result.invitations_queued > 1 ? 's' : ''} en file.`,
      )
      onCompleted()
      handleOpenChange(false)
    } catch {
      toast.error('L’import a changé depuis la prévisualisation. Relancez la vérification.')
      setPreview(null)
    }
  }

  const isPreviewing = previewMutation.isPending || filePreviewMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <form
          className="flex min-h-0 flex-col gap-5"
          noValidate
          onSubmit={(event) => { event.preventDefault(); void form.handleSubmit() }}
        >
          <DialogHeader>
            <DialogTitle>Importer plusieurs utilisateurs</DialogTitle>
            <DialogDescription>
              Tous les comptes du lot auront le même rôle. Un import ne peut jamais créer d’administrateur.
            </DialogDescription>
          </DialogHeader>

          {!preview ? (
            <div className="grid min-h-0 gap-4">
              {mode === 'platform' && (
                <form.Field name="organizationId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Organisation</FieldLabel>
                      <Select value={field.state.value} onValueChange={(value) => field.handleChange(String(value))}>
                        <SelectTrigger className="w-full"><SelectValue>{organizations.find((item) => item.id === field.state.value)?.name ?? 'Sélectionner une organisation'}</SelectValue></SelectTrigger>
                        <SelectContent>{organizations.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
              )}

              <form.Field name="role">
                {(field) => (
                  <Field>
                    <FieldLabel>Type de comptes</FieldLabel>
                    <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as BulkMemberRole)}>
                      <SelectTrigger className="w-full"><SelectValue>{roleLabels[field.state.value]}</SelectValue></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Enseignants</SelectItem>
                        <SelectItem value="student">Étudiants</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <Tabs value={source} onValueChange={(value) => { setSource(value as 'manual' | 'excel'); setPreview(null) }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual"><Users />Saisie multiple</TabsTrigger>
                  <TabsTrigger value="excel"><FileSpreadsheet />Fichier Excel</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="pt-3">
                  <form.Field name="emails">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Adresses e-mail</FieldLabel>
                        <Textarea
                          id={field.name}
                          className="min-h-40 resize-none"
                          placeholder={'alice@example.com\nbob@example.com'}
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Une adresse par ligne, ou séparées par une virgule. Maximum 500.</p>
                      </Field>
                    )}
                  </form.Field>
                </TabsContent>
                <TabsContent value="excel" className="pt-3">
                  <Field>
                    <FieldLabel htmlFor="member-import-file">Fichier .xlsx</FieldLabel>
                    <Input
                      id="member-import-file"
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-muted-foreground">La première feuille doit contenir une colonne nommée « email ». Maximum 2 Mo.</p>
                  </Field>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.total} lignes</Badge>
                <Badge className="bg-emerald-100 text-emerald-800">{preview.valid} valides</Badge>
                {preview.invalid > 0 && <Badge variant="destructive">{preview.invalid} erreurs</Badge>}
              </div>
              {!preview.can_confirm && (
                <Alert variant="destructive">
                  <AlertTitle>Import impossible</AlertTitle>
                  <AlertDescription>Corrigez toutes les lignes signalées avant de confirmer.</AlertDescription>
                </Alert>
              )}
              <div className="min-h-0 max-h-72 overflow-auto rounded-lg border">
                {preview.rows.map((row) => (
                  <div key={row.row} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b px-3 py-2 last:border-b-0 odd:bg-muted/45">
                    <span className="text-muted-foreground">{row.row}</span>
                    <div className="min-w-0">
                      <p className="truncate">{row.email}</p>
                      {row.error && <p className="text-xs text-destructive">{row.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => preview ? setPreview(null) : handleOpenChange(false)}>
              {preview ? 'Modifier' : 'Annuler'}
            </Button>
            {preview ? (
              <Button type="button" disabled={!preview.can_confirm || confirmMutation.isPending} onClick={() => void confirm()}>
                {confirmMutation.isPending && <LoaderCircle className="animate-spin" />}
                Créer {preview.valid} compte{preview.valid > 1 ? 's' : ''}
              </Button>
            ) : (
              <Button type="submit" disabled={isPreviewing || (source === 'excel' && !file)}>
                {isPreviewing && <LoaderCircle className="animate-spin" />}
                Vérifier le lot
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
