import { useState } from 'react'
import { CalendarRange, CheckCircle2, ChevronsUpDown, Plus } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  useAcademicYearContext,
  useActivateAcademicYearMutation,
} from '@/features/academic-year-context'
import { useOrganizationContext } from '@/features/organization-context'
import { CreateAcademicYearDialog } from '@/features/academic-year-context/components/create-academic-year-dialog'

export function AcademicYearSwitcher() {
  const { currentOrganization } = useOrganizationContext()
  const {
    academicYears,
    currentAcademicYear,
    isLoading,
    selectAcademicYear,
  } = useAcademicYearContext()
  const activateMutation = useActivateAcademicYearMutation()
  const { setOpenMobile } = useSidebar()
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  if (!currentOrganization) return null

  function handleSelection(academicYearId: string) {
    selectAcademicYear(academicYearId)
    setOpen(false)
    setOpenMobile(false)
  }

  async function activateSelection() {
    if (!currentAcademicYear || currentAcademicYear.is_active) return
    try {
      await activateMutation.mutateAsync({
        organizationId: currentOrganization!.id,
        academicYearId: currentAcademicYear.id,
      })
      toast.success(`${currentAcademicYear.label} est maintenant l’année active.`)
      setOpen(false)
    } catch {
      toast.error('L’année active n’a pas pu être modifiée.')
    }
  }

  return (
    <>
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={(
              <SidebarMenuButton
                tooltip={currentAcademicYear?.label ?? 'Année scolaire'}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            )}
          >
            <CalendarRange />
            <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
              {currentAcademicYear?.label ?? (isLoading ? 'Chargement…' : 'Aucune année')}
            </span>
            <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-64">
            <DropdownMenuRadioGroup
              value={currentAcademicYear?.id ?? ''}
              onValueChange={handleSelection}
            >
              <DropdownMenuLabel>Année consultée</DropdownMenuLabel>
              {academicYears.map((academicYear) => (
                <DropdownMenuRadioItem key={academicYear.id} value={academicYear.id}>
                  <span>{academicYear.label}</span>
                  {academicYear.is_active && (
                    <span className="ml-auto pr-2 text-xs text-muted-foreground">Active</span>
                  )}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {currentOrganization.role === 'organization_admin' && currentAcademicYear && !currentAcademicYear.is_active && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled={activateMutation.isPending} onClick={() => void activateSelection()}>
                    <CheckCircle2 />Définir comme année active
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            {currentOrganization.role === 'organization_admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                    <Plus />Nouvelle année scolaire
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      </SidebarMenu>
      <CreateAcademicYearDialog open={createOpen} organizationId={currentOrganization.id} onOpenChange={setCreateOpen} />
    </>
  )
}
