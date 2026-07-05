import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EntityCell } from '../../components/ui/EntityCell'
import { StatusToggle } from '../../components/ui/StatusToggle'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
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
import * as inventoryService from '../../services/inventoryService'
import type { MaterialResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { getDisplayUomLabel, getStockUomLabel } from '../../utils/inventoryUom'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { MaterialCatalogImportModal } from './MaterialCatalogImportModal'
import { MaterialFormModal } from './MaterialFormModal'
import { useInventoryLookups } from './useInventoryLookups'

type StatusFilter = 'all' | 'active' | 'inactive'

export function MaterialsPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()
  const { categories, uoms } = useInventoryLookups()

  const [catalogModalOpen, setCatalogModalOpen] = useState(false)
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [uomId, setUomId] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editing, setEditing] = useState<MaterialResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadMaterials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await inventoryService.getMaterials({
        search: search.trim() || undefined,
        categoryId: categoryId || undefined,
        defaultUomId: uomId || undefined,
        active:
          statusFilter === 'all' ? undefined : statusFilter === 'active',
      })
      setMaterials(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [categoryId, search, statusFilter, t, uomId])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadMaterials(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadMaterials])

  useEffect(() => {
    if (searchParams.get('catalog') === '1') {
      setCatalogModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(material: MaterialResponse) {
    setModalMode('edit')
    setEditing(material)
    setModalOpen(true)
  }

  async function handleToggleStatus(material: MaterialResponse) {
    if (!canManage) return
    setRowActionId(material.id)
    try {
      if (material.active) {
        await inventoryService.deactivateMaterial(material.id)
        notify.success(t('inventory.toast.deactivateSuccess'))
      } else {
        await inventoryService.activateMaterial(material.id)
        notify.success(t('inventory.toast.activateSuccess'))
      }
      await loadMaterials()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  function handleFormSuccess() {
    notify.success(
      modalMode === 'create'
        ? t('inventory.toast.createSuccess')
        : t('inventory.toast.updateSuccess'),
    )
    void loadMaterials()
  }

  if (!canView) return <InventoryAccessDenied />

  const showEmpty = !loading && !error && materials.length === 0
  const showTable = !loading && !error && materials.length > 0

  return (
    <ListPage className="materials-page">
      <PageHeader
        title={t('inventory.materials.title')}
        description={t('inventory.materials.subtitle')}
        action={
          canManage ? (
            <div className="page-header__actions">
              <Button variant="secondary" onClick={() => setCatalogModalOpen(true)}>
                {t('inventory.materials.chooseCatalog')}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/inventory/material-categories')}>
                {t('inventory.materials.manageGroups')}
              </Button>
              <ListPrimaryAction
                label={t('inventory.materials.addNew')}
                onClick={openCreate}
              />
            </div>
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.materials.listTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={categoryId}
                onChange={setCategoryId}
                options={[
                  { value: '', label: t('inventory.common.allCategories') },
                  ...categories.map((c) => ({ value: String(c.id), label: c.name })),
                ]}
                ariaLabel={t('inventory.col.category')}
              />
              <SelectFilter
                value={uomId}
                onChange={setUomId}
                options={[
                  { value: '', label: t('inventory.common.allUoms') },
                  ...uoms.map((u) => ({ value: String(u.id), label: u.name })),
                ]}
                ariaLabel={t('inventory.col.defaultUom')}
              />
              <StatusFilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel={t('common.status')}
              />
            </>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.materials.loading')}
          loadingColumns={8}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.materials.empty.title')}
          emptyDescription={t('inventory.materials.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.materials.add') : undefined}
          onEmptyAction={canManage ? openCreate : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.col.name')}</Th>
                  <Th>{t('inventory.col.nameAr')}</Th>
                  <Th>{t('inventory.col.category')}</Th>
                  <Th>{t('inventory.col.displayUom')}</Th>
                  <Th>{t('inventory.col.stockUom')}</Th>
                  <Th>{t('inventory.col.minimumStock')}</Th>
                  <Th>{t('inventory.col.source')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {materials.map((material) => {
                  const busy = rowActionId === material.id
                  const source = material.catalogId
                    ? t('inventory.common.catalog')
                    : t('inventory.common.custom')

                  return (
                    <TableRow key={material.id}>
                      <Td column="entity">
                        <EntityCell
                          name={getInventoryLocalizedName(material, locale)}
                          code={material.code}
                          compact
                        />
                      </Td>
                      <Td dir="rtl">
                        {displayArabicName(material.nameAr, t('common.empty.dash'))}
                      </Td>
                      <Td>{material.categoryName ?? t('common.empty.dash')}</Td>
                      <Td>{getDisplayUomLabel(material, locale, uoms)}</Td>
                      <Td className="text-muted text-sm">
                        {getStockUomLabel(material, locale, uoms)}
                      </Td>
                      <Td dir="ltr">
                        {material.minimumStockLevel ?? t('common.empty.dash')}
                      </Td>
                      <Td>
                        <Badge variant={material.catalogId ? 'muted' : 'success'}>
                          {source}
                        </Badge>
                      </Td>
                      <StopPropagationCell column="status">
                        {canManage ? (
                          <StatusToggle
                            active={material.active}
                            disabled={busy}
                            entityName={material.name}
                            onToggle={() => void handleToggleStatus(material)}
                          />
                        ) : (
                          <Badge variant={material.active ? 'success' : 'inactive'}>
                            {material.active
                              ? t('common.status.active')
                              : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                      {canManage ? (
                        <StopPropagationCell>
                          <TableRowActions
                            onEdit={() => openEdit(material)}
                            disabled={busy}
                            menuItems={[]}
                          />
                        </StopPropagationCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <MaterialCatalogImportModal
        open={catalogModalOpen}
        onClose={() => setCatalogModalOpen(false)}
        onImported={() => void loadMaterials()}
      />

      <MaterialFormModal
        open={modalOpen}
        mode={modalMode}
        material={editing}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </ListPage>
  )
}
