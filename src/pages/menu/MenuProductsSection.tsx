import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import {
  ListCard,
  ListCardHeader,
  ListPageStates,
  ListPrimaryAction,
} from '../../components/ui/ListPage'
import { SelectFilter } from '../../components/ui/SelectFilter'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { Product } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { useMenuCategories } from './MenuCategoriesContext'
import { formatMenuPrice } from './menuNumberUtils'

const variantCache = new Map<number, Product[]>()
const variantRequests = new Map<number, Promise<Product[]>>()

async function getCachedVariants(parentId: number): Promise<Product[]> {
  const cached = variantCache.get(parentId)
  if (cached) return cached

  const existingRequest = variantRequests.get(parentId)
  if (existingRequest) return existingRequest

  const request = menuService
    .getProductVariants(parentId)
    .then((variants) => {
      variantCache.set(parentId, variants)
      return variants
    })
    .finally(() => variantRequests.delete(parentId))
  variantRequests.set(parentId, request)
  return request
}

export function MenuProductsSection() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { categories } = useMenuCategories()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [variantsByParent, setVariantsByParent] = useState<Record<number, Product[]>>({})
  const [variantLoadErrors, setVariantLoadErrors] = useState<Set<number>>(new Set())
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set())
  const [openActionsProductId, setOpenActionsProductId] = useState<number | null>(null)
  const [confirmingDeleteProductId, setConfirmingDeleteProductId] = useState<number | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null)

  const loadProducts = useCallback(async (options?: { refreshVariants?: boolean }) => {
    setLoading(true)
    setError('')
    if (options?.refreshVariants) variantCache.clear()
    try {
      const data = await menuService.getProducts({
        menuCategoryId: categoryFilter === 'all' ? undefined : Number(categoryFilter),
      })
      setProducts(data)

      const embedded = new Map<number, Product[]>()
      data.forEach((candidate) => {
        if (candidate.parentProductId == null) return
        const siblings = embedded.get(candidate.parentProductId) ?? []
        siblings.push(candidate)
        embedded.set(candidate.parentProductId, siblings)
      })

      const parents = data.filter((candidate) => candidate.parentProductId == null && candidate.parent)
      const results = await Promise.allSettled(
        parents.map(async (parent) => {
          const embeddedVariants = embedded.get(parent.id)
          if (categoryFilter === 'all' && embeddedVariants) {
            variantCache.set(parent.id, embeddedVariants)
          }
          return {
            parentId: parent.id,
            variants:
              categoryFilter === 'all' && embeddedVariants
                ? embeddedVariants
                : await getCachedVariants(parent.id),
          }
        }),
      )
      const nextVariants: Record<number, Product[]> = {}
      const failedParents = new Set<number>()
      results.forEach((result, index) => {
        const parentId = parents[index].id
        if (result.status === 'fulfilled') {
          nextVariants[parentId] = result.value.variants
        } else {
          nextVariants[parentId] = []
          failedParents.add(parentId)
        }
      })
      setVariantsByParent(nextVariants)
      setVariantLoadErrors(failedParents)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProducts(), 0)
    return () => window.clearTimeout(timer)
  }, [loadProducts])

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: t('menu.products.filter.allCategories') },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories, t],
  )

  function openCreate() {
    const query = categoryFilter === 'all' ? '' : `?categoryId=${categoryFilter}`
    navigate(`/menu/products/new${query}`)
  }

  function openEdit(product: Product) {
    navigate(`/menu/products/${product.id}/edit`)
  }

  function removeProductFromState(productId: number) {
    variantCache.delete(productId)
    setProducts((current) => current.filter((product) => product.id !== productId))
    setVariantsByParent((current) => {
      const next = { ...current }
      delete next[productId]
      for (const [parentId, variants] of Object.entries(next)) {
        next[Number(parentId)] = variants.filter((variant) => variant.id !== productId)
      }
      return next
    })
    setExpandedParents((current) => {
      const next = new Set(current)
      next.delete(productId)
      return next
    })
  }

  async function confirmDelete(product: Product) {
    setDeletingProductId(product.id)
    setError('')
    try {
      await menuService.deleteProduct(product.id)
      removeProductFromState(product.id)
      setConfirmingDeleteProductId(null)
      setOpenActionsProductId(null)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setDeletingProductId(null)
    }
  }

  const visibleProducts = useMemo(() => {
    const topLevel = products.filter((product) => product.parentProductId == null)
    if (categoryFilter === 'all') return topLevel

    const selectedCategoryId = Number(categoryFilter)
    return topLevel.filter((product) => {
      if (product.menuCategoryId === selectedCategoryId) return true
      return (variantsByParent[product.id] ?? []).some(
        (variant) => variant.menuCategoryId === selectedCategoryId,
      )
    })
  }, [categoryFilter, products, variantsByParent])

  const showEmpty = !loading && !error && visibleProducts.length === 0
  const showTable = !loading && !error && visibleProducts.length > 0
  const emptyIsFiltered = categoryFilter !== 'all'

  function toggleParent(parentId: number) {
    setExpandedParents((current) => {
      const next = new Set(current)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  function getParentPrice(parent: Product): string {
    if (variantLoadErrors.has(parent.id)) return t('common.empty.dash')
    const prices = (variantsByParent[parent.id] ?? [])
      .map((variant) => variant.sellingPrice)
      .filter((price) => Number.isFinite(price))
    const uniquePrices = [...new Set(prices)].sort((a, b) => a - b)
    if (uniquePrices.length === 0) return t('common.empty.dash')
    if (uniquePrices.length === 1) return formatMenuPrice(uniquePrices[0], locale)
    return `${formatMenuPrice(uniquePrices[0], locale)} – ${formatMenuPrice(uniquePrices.at(-1)!, locale)}`
  }

  function renderProductRow(product: Product, nested = false) {
    const variants = variantsByParent[product.id] ?? []
    const isExpanded = expandedParents.has(product.id)
    const variantLabel =
      locale === 'ar'
        ? product.variantLabelAr || product.variantLabel
        : product.variantLabel || product.variantLabelAr

    return (
      <TableRow className={nested ? 'menu-products__variant-row' : undefined}>
        <Td column="entity">
          <div className={`menu-products__name${nested ? ' menu-products__name--variant' : ''}`}>
            {product.parent && !nested ? (
              <button
                type="button"
                className={`menu-products__expand${isExpanded ? ' menu-products__expand--open' : ''}`}
                onClick={() => toggleParent(product.id)}
                aria-expanded={isExpanded}
                aria-label={t('menu.products.actions.toggleVariants', { name: product.name })}
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
            ) : nested ? (
              <span className="menu-products__branch" aria-hidden="true" />
            ) : null}
            <span className="menu-products__name-copy">
              {nested && variantLabel ? (
                <span className="menu-products__variant-chip">{variantLabel}</span>
              ) : null}
              <strong>{product.name}</strong>
            </span>
            {product.parent && !nested ? (
              <>
                <Badge variant="primary">{t('menu.products.badge.parent')}</Badge>
                <Badge variant="muted">{t('menu.products.badge.variantCount', { count: product.variantCount ?? variants.length })}</Badge>
              </>
            ) : null}
            {nested || product.parentProductId != null ? (
              <Badge variant="muted">{t('menu.products.badge.variant')}</Badge>
            ) : null}
          </div>
        </Td>
        <Td>{product.menuCategoryName ?? t('common.empty.dash')}</Td>
        <Td dir="ltr" className={`table-cell--numeric${product.parent && !nested ? ' menu-products__price-range' : ''}`}>
          {product.parent && !nested
            ? getParentPrice(product)
            : formatMenuPrice(product.sellingPrice, locale)}
        </Td>
        <Td column="status">
          <Badge variant={nested || product.parentProductId != null || !product.isMenu ? 'muted' : product.active ? 'success' : 'inactive'}>
            {nested || product.parentProductId != null || !product.isMenu
              ? t('menu.products.status.hidden')
              : product.active
                ? t('common.active')
                : t('common.inactive')}
          </Badge>
        </Td>
        <Td>
          {confirmingDeleteProductId === product.id ? (
            <div className="menu-products__delete-confirm">
              <span>{t('product.delete.confirm.message')}</span>
              <button
                type="button"
                className="menu-products__action menu-products__action--danger"
                onClick={() => void confirmDelete(product)}
                disabled={deletingProductId === product.id}
              >
                <Trash2 size={15} aria-hidden="true" />
                {t('product.delete.confirm.action')}
              </button>
              <button
                type="button"
                className="menu-products__action"
                onClick={() => setConfirmingDeleteProductId(null)}
                disabled={deletingProductId === product.id}
              >
                {t('product.delete.confirm.cancel')}
              </button>
            </div>
          ) : (
            <div className="menu-products__row-actions">
              <button type="button" className="menu-products__action" onClick={() => openEdit(product)}>
                <Pencil size={15} aria-hidden="true" />
                {t('common.edit')}
              </button>
              {!nested ? (
                <div className="menu-products__overflow">
                  <button
                    type="button"
                    className="menu-products__icon-action"
                    aria-label={t('menu.products.actions.more')}
                    title={t('menu.products.actions.more')}
                    aria-expanded={openActionsProductId === product.id}
                    onClick={() => setOpenActionsProductId((current) => (current === product.id ? null : product.id))}
                  >
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </button>
                  {openActionsProductId === product.id ? (
                    <div className="menu-products__overflow-panel">
                      <button
                        type="button"
                        className="menu-products__overflow-item menu-products__overflow-item--danger"
                        onClick={() => {
                          setConfirmingDeleteProductId(product.id)
                          setOpenActionsProductId(null)
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {t('menu.products.actions.delete')}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </Td>
      </TableRow>
    )
  }

  return (
    <>
      <ListCard>
        <ListCardHeader
          title={t('menu.products.listTitle')}
          toolbar={
            <>
              <SelectFilter
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                ariaLabel={t('menu.products.filter.category')}
              />
              <ListPrimaryAction label={t('menu.products.add')} onClick={openCreate} />
            </>
          }
        />

        {error ? <div className="page-error-banner">{error}</div> : null}

        <ListPageStates
          loading={loading}
          loadingMessage={t('menu.products.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={
            emptyIsFiltered
              ? t('menu.products.empty.filteredTitle')
              : t('menu.products.empty.title')
          }
          emptyDescription={
            emptyIsFiltered
              ? t('menu.products.empty.filteredSubtitle')
              : t('menu.products.empty.subtitle')
          }
          emptyActionLabel={emptyIsFiltered ? undefined : t('menu.products.add')}
          onEmptyAction={emptyIsFiltered ? undefined : openCreate}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('menu.col.name')}</Th>
                  <Th>{t('menu.col.category')}</Th>
                  <Th className="table-cell--numeric">{t('menu.col.sellingPrice')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('menu.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleProducts.map((product) => (
                  <Fragment key={product.id}>
                    {renderProductRow(product)}
                    {product.parent && expandedParents.has(product.id)
                      ? (variantsByParent[product.id] ?? []).map((variant) => (
                          <Fragment key={variant.id}>{renderProductRow(variant, true)}</Fragment>
                        ))
                      : null}
                  </Fragment>
                ))}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>
    </>
  )
}
