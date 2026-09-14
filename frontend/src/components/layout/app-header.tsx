import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md">
      <SidebarTrigger aria-label="Ouvrir ou fermer le menu" />
      <Separator orientation="vertical" className="h-5" />
      <p className="text-sm font-medium">Espace Progressia</p>
    </header>
  )
}
