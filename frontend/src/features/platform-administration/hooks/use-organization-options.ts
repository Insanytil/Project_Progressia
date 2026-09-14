import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'

import { organizationsQueryOptions } from '../queries/organization-queries'

const PAGE_SIZE = 100

export function useOrganizationOptions() {
  const firstPage = useQuery(organizationsQueryOptions({ page: 1, pageSize: PAGE_SIZE }))
  const remainingPages = useQueries({
    queries: Array.from(
      { length: Math.max(0, (firstPage.data?.pagination.total_pages ?? 1) - 1) },
      (_, index) => organizationsQueryOptions({ page: index + 2, pageSize: PAGE_SIZE }),
    ),
  })

  const organizations = useMemo(
    () => [
      ...(firstPage.data?.items ?? []),
      ...remainingPages.flatMap((page) => page.data?.items ?? []),
    ],
    [firstPage.data?.items, remainingPages],
  )

  return {
    organizations,
    isPending: firstPage.isPending || remainingPages.some((page) => page.isPending),
    isError: firstPage.isError || remainingPages.some((page) => page.isError),
  }
}
