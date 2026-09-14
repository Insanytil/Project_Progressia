import { PlatformAdministrationTabs } from '@/features/platform-administration'

export function PlatformAdministrationPage() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden p-5 sm:p-8">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-col">
        <PlatformAdministrationTabs />
      </div>
    </div>
  )
}
