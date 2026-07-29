import { SelectFilter } from '../ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import type { BranchResponse } from '../../types/branch'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../types/inventory'
import type { FilterConfig, ReportFilters } from '../../types/reports'
import { getLocalizedBranchName } from '../../utils/branchDisplay'

type ReportFilterBarProps = {
  filters: FilterConfig[]
  values: ReportFilters
  branches: BranchResponse[]
  warehouses: WarehouseResponse[]
  categories: MaterialCategoryResponse[]
  loadingOptions?: boolean
  onChange: (values: ReportFilters) => void
}

function hasFilter(filters: FilterConfig[], id: FilterConfig['id']) {
  return filters.some((filter) => filter.id === id)
}

export function ReportFilterBar({
  filters,
  values,
  branches,
  warehouses,
  categories,
  loadingOptions = false,
  onChange,
}: ReportFilterBarProps) {
  const { t, locale } = useTranslation()
  const dateRangeConfig = filters.find((filter) => filter.id === 'dateRange')
  const warehouseDisabled = !values.branchId || loadingOptions

  return (
    <div className="report-filter-bar">
      {hasFilter(filters, 'branch') ? (
        <SelectFilter
          value={values.branchId}
          onChange={(branchId) =>
            onChange({
              ...values,
              branchId,
              warehouseId: '',
            })
          }
          options={[
            { value: '', label: t('reports.filters.allBranches') },
            ...branches.filter((branch) => branch.active).map((branch) => ({
              value: String(branch.id),
              label: getLocalizedBranchName(branch, locale),
            })),
          ]}
          ariaLabel={t('reports.filters.branch')}
          disabled={loadingOptions}
        />
      ) : null}

      {hasFilter(filters, 'warehouse') ? (
        <SelectFilter
          value={values.warehouseId}
          onChange={(warehouseId) => onChange({ ...values, warehouseId })}
          options={
            values.branchId
              ? [
                  { value: '', label: t('reports.filters.allWarehouses') },
                  ...warehouses.map((warehouse) => ({
                    value: String(warehouse.id),
                    label: locale === 'ar' ? warehouse.nameAr || warehouse.name : warehouse.name,
                  })),
                ]
              : [{ value: '', label: t('reports.filters.selectBranchFirst') }]
          }
          ariaLabel={t('reports.filters.warehouse')}
          disabled={warehouseDisabled}
        />
      ) : null}

      {hasFilter(filters, 'category') ? (
        <SelectFilter
          value={values.categoryId}
          onChange={(categoryId) => onChange({ ...values, categoryId })}
          options={[
            { value: '', label: t('reports.filters.allCategories') },
            ...categories.filter((category) => category.active).map((category) => ({
              value: String(category.id),
              label: locale === 'ar'
                ? category.nameAr || category.nameEn || category.name
                : category.nameEn || category.name,
            })),
          ]}
          ariaLabel={t('reports.filters.category')}
          disabled={loadingOptions}
        />
      ) : null}

      {dateRangeConfig ? (
        <div className="report-filter-bar__date-range">
          <label className="report-filter-bar__date-field">
            <span>{t('reports.filters.dateFrom')}</span>
            <input
              type="date"
              value={values.dateFrom}
              onChange={(event) => onChange({ ...values, dateFrom: event.target.value })}
              required={dateRangeConfig.required}
            />
          </label>
          <label className="report-filter-bar__date-field">
            <span>{t('reports.filters.dateTo')}</span>
            <input
              type="date"
              value={values.dateTo}
              onChange={(event) => onChange({ ...values, dateTo: event.target.value })}
              required={dateRangeConfig.required}
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}
