import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { useTranslation } from '../../i18n/useTranslation'

interface ListPaginationProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  disabled?: boolean
  translationPrefix?: string
}

export function ListPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  disabled = false,
  translationPrefix = 'orders.pagination',
}: ListPaginationProps) {
  const { t } = useTranslation()

  if (totalElements === 0) return null

  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)
  const canGoPrev = page > 0
  const canGoNext = page < totalPages - 1

  return (
    <div className="list-pagination">
      <span className="list-pagination__summary">
        {t(`${translationPrefix}.summary`, { from, to, total: totalElements })}
      </span>
      <div className="list-pagination__controls">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || !canGoPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label={t(`${translationPrefix}.prev`)}
        >
          <ChevronLeft size={16} aria-hidden />
          {t(`${translationPrefix}.prev`)}
        </Button>
        <span className="list-pagination__page">
          {t(`${translationPrefix}.pageOf`, { page: page + 1, totalPages })}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || !canGoNext}
          onClick={() => onPageChange(page + 1)}
          aria-label={t(`${translationPrefix}.next`)}
        >
          {t(`${translationPrefix}.next`)}
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
