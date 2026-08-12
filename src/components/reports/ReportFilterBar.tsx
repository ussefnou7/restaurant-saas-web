import { SelectFilter } from '../ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import type { BranchResponse } from '../../types/branch'
import type { MaterialCategoryResponse, WarehouseResponse } from '../../types/inventory'
import type { FilterConfig, ReportFilterId, ReportFilters } from '../../types/reports'
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
  const warehouseDisabled = !values.branchId || loadingOptions
  const renderFilter = (filter: ReportFilterId) => {
    switch (filter) {
      case 'branch':
        return (
          <SelectFilter
            key={filter}
            value={values.branchId ?? ''}
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
        )

      case 'warehouse':
        return (
          <SelectFilter
            key={filter}
            value={values.warehouseId ?? ''}
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
        )

      case 'category':
        return (
          <SelectFilter
            key={filter}
            value={values.categoryId ?? ''}
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
        )

      default:
        return null
    }
  }

  return <div className="report-filter-bar">{filters.map(renderFilter)}</div>
}
