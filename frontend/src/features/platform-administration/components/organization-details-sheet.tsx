import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import type { Organization } from '../model/organization.types'

const dateTimeFormatter = new Intl.DateTimeFormat('fr-BE', {
  dateStyle: 'long',
  timeStyle: 'short',
})

type OrganizationDetailsSheetProps = {
  organization: Organization | null
  onOpenChange: (open: boolean) => void
}

export function OrganizationDetailsSheet({ organization, onOpenChange }: OrganizationDetailsSheetProps) {
  return (
    <Sheet open={Boolean(organization)} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{organization?.name ?? 'Organisation'}</SheetTitle>
          <SheetDescription>Informations détaillées de l’organisation.</SheetDescription>
        </SheetHeader>
        {organization && (
          <dl className="grid gap-5 px-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Identifiant</dt>
              <dd className="mt-1 break-all font-mono text-xs">{organization.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="mt-1 font-medium">{organization.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd className="mt-1">
                <Badge variant={organization.is_active ? 'secondary' : 'outline'}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Créée le</dt>
              <dd className="mt-1">{dateTimeFormatter.format(new Date(organization.created_at))}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Dernière modification</dt>
              <dd className="mt-1">{dateTimeFormatter.format(new Date(organization.updated_at))}</dd>
            </div>
          </dl>
        )}
      </SheetContent>
    </Sheet>
  )
}
