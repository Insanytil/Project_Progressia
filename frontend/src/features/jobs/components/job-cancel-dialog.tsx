import { LoaderCircle, TriangleAlert } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import type { JobActionTarget } from '../model/job.types'

type JobCancelDialogProps = {
  job: JobActionTarget | null
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function JobCancelDialog({ job, isPending, onConfirm, onOpenChange }: JobCancelDialogProps) {
  return (
    <AlertDialog open={Boolean(job)} onOpenChange={(open) => !isPending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive"><TriangleAlert /></AlertDialogMedia>
          <AlertDialogTitle>Annuler ce job ?</AlertDialogTitle>
          <AlertDialogDescription>
            {job?.recipient_email
              ? `L’e-mail en attente pour ${job.recipient_email} ne sera pas envoyé.`
              : 'Le traitement en attente ne sera pas exécuté.'}{' '}
            Le job pourra être relancé ultérieurement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Retour</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending && <LoaderCircle className="animate-spin" />}Annuler le job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
