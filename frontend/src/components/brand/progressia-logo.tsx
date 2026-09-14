import { cn } from '@/lib/utils'

type ProgressiaLogoProps = {
  className?: string
  compactOnSidebarCollapse?: boolean
  inverted?: boolean
}

export function ProgressiaLogo({
  className,
  compactOnSidebarCollapse = false,
  inverted = false,
}: ProgressiaLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl text-base font-bold shadow-sm',
          inverted ? 'bg-white text-primary' : 'bg-primary text-primary-foreground',
          compactOnSidebarCollapse && 'group-data-[collapsible=icon]:size-8',
        )}
      >
        P
      </span>
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          inverted ? 'text-white' : 'text-primary',
          compactOnSidebarCollapse && 'group-data-[collapsible=icon]:hidden',
        )}
      >
        Progressia
      </span>
    </div>
  )
}
