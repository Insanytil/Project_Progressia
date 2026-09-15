import { useState } from 'react'
import { Building2, ChevronsUpDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useOrganizationContext } from '@/features/organization-context'

export function OrganizationSwitcher() {
  const { currentOrganization, organizations, selectOrganization } = useOrganizationContext()
  const { setOpenMobile } = useSidebar()
  const [open, setOpen] = useState(false)

  if (organizations.length === 0) {
    return (
      <p className="px-1 py-2 text-xs text-sidebar-foreground/65 group-data-[collapsible=icon]:hidden">
        Aucune organisation active
      </p>
    )
  }

  function handleOrganizationChange(organizationId: string) {
    setOpen(false)
    if (organizationId === currentOrganization?.id) return

    setOpenMobile(false)
    selectOrganization(organizationId)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                size="lg"
                tooltip={currentOrganization?.name ?? 'Changer d’organisation'}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
              <Building2 />
            </span>
            <span className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium">
                {currentOrganization?.name ?? 'Choisir une organisation'}
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/60">
                Espace actif
              </span>
            </span>
            <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-64">
            <DropdownMenuRadioGroup
              value={currentOrganization?.id ?? ''}
              onValueChange={handleOrganizationChange}
            >
              <DropdownMenuLabel>Changer d’organisation</DropdownMenuLabel>
              {organizations.map((organization) => (
                <DropdownMenuRadioItem key={organization.id} value={organization.id}>
                  <Building2 />
                  <span className="truncate">{organization.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
