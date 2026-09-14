import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'

type PaginationControlsProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getVisiblePages(page: number, totalPages: number) {
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4))
  const count = Math.min(5, totalPages)
  return Array.from({ length: count }, (_, index) => firstPage + index)
}

export function PaginationControls({ page, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="mx-0 w-auto">
      <PaginationContent>
        <PaginationItem>
          <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente">
            <ChevronLeft />
          </Button>
        </PaginationItem>
        {getVisiblePages(page, totalPages).map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <Button
              variant={pageNumber === page ? 'outline' : 'ghost'}
              size="icon"
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          </PaginationItem>
        ))}
        <PaginationItem>
          <Button variant="ghost" size="icon" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">
            <ChevronRight />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
