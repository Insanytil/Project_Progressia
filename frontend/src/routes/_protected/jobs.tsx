import { createFileRoute } from '@tanstack/react-router'

import { requireJobsAdmin } from '@/features/auth'
import { JobsPage } from '@/pages/jobs-page'

export const Route = createFileRoute('/_protected/jobs')({
  beforeLoad: ({ context }) => requireJobsAdmin(context.queryClient),
  component: JobsPage,
})
