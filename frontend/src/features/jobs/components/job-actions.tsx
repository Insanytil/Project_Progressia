import { Ban, MoreHorizontal, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { JobActionTarget } from '../model/job.types'

type JobActionsProps = {
  job: JobActionTarget
  isPending: boolean
  onRetry: () => void
  onCancel: () => void
}

export function JobActions({ job, isPending, onRetry, onCancel }: JobActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <MoreHorizontal />
        <span className="sr-only">Actions du job</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={isPending || !['failed', 'cancelled'].includes(job.status)}
            onClick={onRetry}
          >
            <RotateCcw />Relancer
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending || job.status !== 'queued'}
            onClick={onCancel}
          >
            <Ban />Annuler
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
