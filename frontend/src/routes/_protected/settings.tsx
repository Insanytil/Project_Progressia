import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '@/pages/settings-page'

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsPage,
})
