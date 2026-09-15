import { GitBranch, MoreHorizontal, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import type { StudyOption } from '../model/study-option.types'

export function StudyOptionActions(props: { studyOption: StudyOption; onManage: (item: StudyOption) => void; onManagePathways: (item: StudyOption) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}><MoreHorizontal /><span className="sr-only">Actions de {props.studyOption.name}</span></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52"><DropdownMenuGroup><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={() => props.onManage(props.studyOption)}><Pencil />Modifier le tronc commun</DropdownMenuItem><DropdownMenuItem onClick={() => props.onManagePathways(props.studyOption)}><GitBranch />Gérer les parcours</DropdownMenuItem></DropdownMenuGroup></DropdownMenuContent>
    </DropdownMenu>
  )
}
