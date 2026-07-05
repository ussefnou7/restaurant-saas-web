import { useState } from 'react'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPageStates,
  ListPrimaryAction,
} from '../../components/ui/ListPage'
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
import type { MenuCategory } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { useMenuCategories } from './MenuCategoriesContext'
import { formatMenuNumber } from './menuNumberUtils'
import { MenuCategoryFormModal } from './MenuCategoryFormModal'

export function MenuCategoriesSection() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const { categories, loading, error, refreshCategories } = useMenuCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<MenuCategory | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<MenuCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(category: MenuCategory) {
    setModalMode('edit')
    setEditing(category)
    setModalOpen(true)
  }

  function openDelete(category: MenuCategory) {
    setDeleting(category)
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return

    setDeleteLoading(true)
    setRowActionId(deleting.id)
    try {
      await menuService.deleteMenuCategory(deleting.id)
      notify.success(t('menu.toast.deleteSuccess'))
      setDeleteOpen(false)
      setDeleting(null)
      await refreshCategories()
    } catch (err) {
      notify.error(translateApiError(err, t).message)
    } finally {
      setDeleteLoading(false)
      setRowActionId(null)
    }
  }

  async function handleToggleStatus(category: MenuCategory) {
    setRowActionId(category.id)
    try {
      await menuService.updateMenuCategory(category.id, {
        name: category.name,
        sortOrder: category.sortOrder,
        active: !category.active,
      })
      notify.success(
        category.active ? t('menu.toast.deactivateSuccess') : t('menu.toast.activateSuccess'),
      )
      await refreshCategories()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && categories.length === 0
  const showTable = !loading && !error && categories.length > 0

  return (
    <>
      <ListCard>
        <ListCardHeader
          title={t('menu.categories.listTitle')}
          toolbar={<ListPrimaryAction label={t('menu.categories.add')} onClick={openCreate} />}
        />

        {error ? <div className="page-error-banner">{error}</div> : null}

        <ListPageStates
          loading={loading}
          loadingMessage={t('menu.categories.loading')}
          loadingColumns={4}
          showEmpty={showEmpty}
          emptyTitle={t('menu.categories.empty.title')}
          emptyDescription={t('menu.categories.empty.subtitle')}
          emptyActionLabel={t('menu.categories.add')}
          onEmptyAction={openCreate}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('menu.col.name')}</Th>
                  <Th>{t('menu.fields.sortOrder')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th>{t('menu.col.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => {
                  const busy = rowActionId === category.id

                  return (
                    <TableRow key={category.id}>
                      <Td column="entity">{category.name}</Td>
                      <Td dir="ltr">{formatMenuNumber(category.sortOrder, locale)}</Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={category.active}
                          disabled={busy}
                          entityName={category.name}
                          onToggle={() => void handleToggleStatus(category)}
                        />
                      </StopPropagationCell>
                      <StopPropagationCell>
                        <TableRowActions
                          onEdit={() => openEdit(category)}
                          disabled={busy}
                          menuItems={[
                            {
                              id: 'delete',
                              label: t('common.delete'),
                              tone: 'danger',
                              onClick: () => openDelete(category),
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

      <MenuCategoryFormModal
        open={modalOpen}
        mode={modalMode}
        category={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(
            modalMode === 'create'
              ? t('menu.toast.createSuccess')
              : t('menu.toast.updateSuccess'),
          )
          void refreshCategories()
        }}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('menu.categories.deleteConfirm.title')}
        message={t('menu.categories.deleteConfirm.message', { name: deleting?.name ?? '' })}
        confirmLabel={t('menu.categories.deleteConfirm.confirm')}
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
