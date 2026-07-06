import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPageStates,
  ListPrimaryAction,
} from '../../components/ui/ListPage'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { StatusToggle } from '../../components/ui/StatusToggle'
import { TableRowActions } from '../../components/ui/TableRowActions'
import {
  DataTable,
  StopPropagationCell,
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
import { MenuProductFormModal } from './MenuProductFormModal'
import { RecipeManageModal } from './RecipeManageModal'

export function MenuProductsSection() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const { categories } = useMenuCategories()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<Product | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await menuService.getProducts({
        menuCategoryId: categoryFilter === 'all' ? undefined : Number(categoryFilter),
      })
      setProducts(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, t])

  useEffect(() => {
    void loadProducts()
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
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setModalMode('edit')
    setEditing(product)
    setModalOpen(true)
  }

  function openDelete(product: Product) {
    setDeleting(product)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return

    setDeleteLoading(true)
    setRowActionId(deleting.id)
    try {
      await menuService.deleteProduct(deleting.id)
      notify.success(t('menu.toast.deleteSuccess'))
      setDeleteOpen(false)
      setDeleting(null)
      await loadProducts()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setDeleteLoading(false)
      setRowActionId(null)
    }
  }

  async function handleToggleActive(product: Product) {
    setRowActionId(product.id)
    try {
      await menuService.toggleProductActive(product.id)
      notify.success(
        product.active ? t('menu.toast.deactivateSuccess') : t('menu.toast.activateSuccess'),
      )
      await loadProducts()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && products.length === 0
  const showTable = !loading && !error && products.length > 0
  const emptyIsFiltered = categoryFilter !== 'all'

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
                {products.map((product) => {
                  const busy = rowActionId === product.id

                  return (
                    <TableRow key={product.id}>
                      <Td column="entity">{product.name}</Td>
                      <Td>{product.menuCategoryName ?? t('common.empty.dash')}</Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatMenuPrice(product.sellingPrice, locale)}</Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={product.active}
                          disabled={busy}
                          entityName={product.name}
                          onToggle={() => void handleToggleActive(product)}
                        />
                      </StopPropagationCell>
                      <StopPropagationCell>
                        <TableRowActions
                          onEdit={() => openEdit(product)}
                          disabled={busy}
                          secondaryAction={{
                            label: t('menu.products.actions.manageRecipe'),
                            onClick: () => setRecipeProduct(product),
                          }}
                          menuItems={[
                            {
                              id: 'delete',
                              label: t('common.delete'),
                              tone: 'danger',
                              onClick: () => openDelete(product),
                              disabled: busy,
                            },
                          ]}
                        />
                      </StopPropagationCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <MenuProductFormModal
        open={modalOpen}
        mode={modalMode}
        product={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('menu.toast.createSuccess')
              : t('menu.toast.updateSuccess'),
          )
          void loadProducts()
        }}
      />

      <RecipeManageModal
        open={recipeProduct !== null}
        product={recipeProduct}
        onClose={() => setRecipeProduct(null)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('menu.products.deleteConfirm.title')}
        message={t('menu.products.deleteConfirm.message', { name: deleting?.name ?? '' })}
        confirmLabel={t('menu.products.deleteConfirm.confirm')}
        loading={deleteLoading}
        onClose={() => {
          if (deleteLoading) return
          setDeleteOpen(false)
          setDeleting(null)
        }}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
