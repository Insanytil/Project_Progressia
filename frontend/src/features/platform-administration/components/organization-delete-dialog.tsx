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

import type { Organization } from '../model/organization.types'

type OrganizationDeleteDialogProps = {
  organization: Organization | null
  isPending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function OrganizationDeleteDialog({
  organization,
  isPending,
  onConfirm,
  onOpenChange,
}: OrganizationDeleteDialogProps) {
  return (
    <AlertDialog
      open={Boolean(organization)}
      onOpenChange={(open) => !isPending && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Supprimer l’organisation ?</AlertDialogTitle>
          <AlertDialogDescription>
            L’organisation « {organization?.name} » sera définitivement supprimée. La suppression sera refusée
            si elle contient encore au moins un membre.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <LoaderCircle className="animate-spin" />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
