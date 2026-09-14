import { createFileRoute } from '@tanstack/react-router'

import { PlatformAdministrationPage } from '@/pages/platform-administration-page'

export const Route = createFileRoute('/_protected/_superuser/platformAdministration')({
  component: PlatformAdministrationPage,
})
