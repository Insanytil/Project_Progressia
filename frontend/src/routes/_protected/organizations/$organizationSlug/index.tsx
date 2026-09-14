import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_protected/organizations/$organizationSlug/',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/organizations/$organizationSlug/dashboard',
      params: { organizationSlug: params.organizationSlug },
    })
  },
})
