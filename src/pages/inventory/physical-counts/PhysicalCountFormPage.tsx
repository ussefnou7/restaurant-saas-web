import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { IconActionButton } from '../../../components/ui/RowActions'
import { ListPage } from '../../../components/ui/ListPage'
import { Modal } from '../../../components/ui/Modal'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useNotify } from '../../../components/ui/NotificationContext'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { FieldGrid, FormField, FormInput, FormSelect, FormTextarea } from '../../../components/fields'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as physicalCountService from '../../../services/physicalCountService'
import type { MaterialResponse, WarehouseResponse } from '../../../types/inventory'
import type { PhysicalCountResponse, PhysicalCountStatus, ReconcileLineAction } from '../../../types/inventoryOperations'
import { formatDate } from '../../../utils/format'
import {
  canDeletePhysicalCount,
  canManageInventoryStock,
  canRevertPhysicalCountToDraft,
  canViewInventoryStock,
} from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { StockAccessDenied } from '../StockAccessDenied'
import { PhysicalCountMaterialPicker } from './PhysicalCountMaterialPicker'
import {
  PhysicalCountInProgressView,
} from './PhysicalCountInProgressView'
import {
  PhysicalCountCancelledView,
  PhysicalCountReconcileView,
  PhysicalCountReconciledView,
} from './PhysicalCountReconcileView'
import { getStatusVariant } from './physicalCountDisplay'

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function getStatusVariantForDraft(status: PhysicalCountStatus): 'muted' | 'warning' | 'success' {
  return getStatusVariant(status)
}

export function PhysicalCountCreatePage() {
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [lookupLoading, setLookupLoading] = useState(true)
  const [warehouseId, setWarehouseId] = useState('')
  const [scheduledDate, setScheduledDate] = useState(todayDateInput())
  const [notes, setNotes] = useState('')
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function loadLookups() {
      try {
        const [ws, ms] = await Promise.all([
          inventoryService.getWarehouses({ active: true }),
          inventoryService.getMaterials({ active: true }),
        ])
        setWarehouses(ws)
        setMaterials(ms)
      } finally {
        setLookupLoading(false)
      }
    }
    void loadLookups()
  }, [])

  const selectedMaterials = useMemo(
    () => materials.filter((material) => selectedMaterialIds.includes(material.id)),
    [materials, selectedMaterialIds],
  )

  function handleMaterialsSelected(ids: number[]) {
    setSelectedMaterialIds((current) => Array.from(new Set([...current, ...ids])))
    setPickerOpen(false)
  }

  function removeMaterial(materialId: number) {
    setSelectedMaterialIds((current) => current.filter((id) => id !== materialId))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!warehouseId) {
      setFormError(t('inventory.physicalCounts.validation.warehouseRequired'))
      return
    }
    if (!scheduledDate) {
      setFormError(t('inventory.physicalCounts.validation.dateRequired'))
      return
    }
    if (selectedMaterialIds.length === 0) {
      setFormError(t('inventory.physicalCounts.validation.materialsRequired'))
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const created = await physicalCountService.createPhysicalCount({
        warehouseId: parseInt(warehouseId, 10),
        scheduledDate,
        notes: notes.trim() || undefined,
        materialIds: selectedMaterialIds,
      })
      notify.success(t('inventory.physicalCounts.toast.createSuccess'))
      navigate(`/inventory/physical-counts/${created.id}`)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  if (!canView) return <StockAccessDenied />

  return (
    <ListPage className="physical-count-form-page">
      <PageHeader
        title={t('inventory.physicalCounts.form.createTitle')}
        description={t('inventory.physicalCounts.form.subtitle')}
        action={
          <Link to="/inventory/physical-counts">
            <Button variant="secondary" type="button">{t('inventory.physicalCounts.form.backToList')}</Button>
          </Link>
        }
      />
      <form onSubmit={(e) => void handleSubmit(e)} className="physical-count-form">
        {formError ? <div className="form-error-banner">{formError}</div> : null}
        <FieldGrid>
          <FormField label={`${t('inventory.physicalCounts.fields.warehouse')} *`}>
            <FormSelect
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={lookupLoading || saving}
            >
              <option value="">{t('inventory.common.selectWarehouse')}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={String(warehouse.id)}>
                  {getInventoryLocalizedName(warehouse, locale)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={`${t('inventory.physicalCounts.fields.scheduledDate')} *`}>
            <FormInput
              type="date"
              ltr
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.physicalCounts.fields.notes')}>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </FormField>
        </FieldGrid>

        <section className="form-section">
          <div className="form-section__header">
            <h2 className="form-section__title">{t('inventory.physicalCounts.fields.materials')}</h2>
            {canManage ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
                disabled={saving || lookupLoading}
              >
                <Plus size={16} aria-hidden />
                {t('inventory.physicalCounts.actions.addMaterials')}
              </Button>
            ) : null}
          </div>

          {selectedMaterials.length === 0 ? (
            <div className="physical-count-detail__no-lines">
              {t('inventory.physicalCounts.form.noMaterialsSelected')}
            </div>
          ) : (
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                  <Th>{t('inventory.physicalCounts.lines.uom')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <Td column="entity">
                      <span>{getInventoryLocalizedName(material, locale)}</span>
                      <span className="entity-cell__code">{material.code}</span>
                    </Td>
                    <Td>{material.stockUomSymbol ?? material.stockUomCode}</Td>
                    {canManage ? (
                      <StopPropagationCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="action"
                          className="action-btn action-btn--icon action-btn--cancel"
                          aria-label={t('inventory.physicalCounts.actions.removeMaterial')}
                          onClick={() => removeMaterial(material.id)}
                          disabled={saving}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </StopPropagationCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </section>

        <div className="form-actions">
          <Button type="submit" variant="primary" disabled={saving || lookupLoading}>
            {saving ? t('common.loading') : t('inventory.physicalCounts.form.submit')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/inventory/physical-counts')} disabled={saving}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>

      <PhysicalCountMaterialPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleMaterialsSelected}
        excludeMaterialIds={selectedMaterialIds}
      />
    </ListPage>
  )
}

export function PhysicalCountViewPage() {
  const { id } = useParams<{ id: string }>()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const canRevert = canRevertPhysicalCountToDraft()
  const canDelete = canDeletePhysicalCount()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const [searchParams, setSearchParams] = useSearchParams()

  const [count, setCount] = useState<PhysicalCountResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [countSaveLoading, setCountSaveLoading] = useState(false)
  const [countSaveError, setCountSaveError] = useState('')
  const [countSavedAt, setCountSavedAt] = useState<string | null>(null)
  const [reconcileLoading, setReconcileLoading] = useState(false)
  const [reconcileError, setReconcileError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [startConfirmOpen, setStartConfirmOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [revertModalOpen, setRevertModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const loadCount = useCallback(async () => {
    if (!id) return
    setError('')
    try {
      const data = await physicalCountService.getPhysicalCount(id)
      setCount(data)
    } catch {
      setError(t('inventory.physicalCounts.loadError'))
      setCount(null)
    }
  }, [id, t])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    void loadCount().finally(() => setLoading(false))
  }, [id, loadCount])

  const isReconcileStage = searchParams.get('stage') === 'reconcile'
  const isInProgress = count?.status === 'IN_PROGRESS'
  const allLinesCounted =
    count != null &&
    count.lines.length > 0 &&
    count.lines.every((line) => line.countedQuantity != null)

  useEffect(() => {
    if (isReconcileStage && isInProgress && count && !allLinesCounted) {
      setSearchParams({})
    }
  }, [allLinesCounted, count, isInProgress, isReconcileStage, setSearchParams])

  async function handleAddMaterials(materialIds: number[]) {
    if (!count || materialIds.length === 0) return
    setActionLoading(true)
    try {
      const updated = await physicalCountService.addPhysicalCountMaterials(count.id, { materialIds })
      setCount(updated)
      setPickerOpen(false)
      notify.success(t('inventory.physicalCounts.toast.addMaterialsSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveMaterial(materialId: number) {
    if (!count) return
    setActionLoading(true)
    try {
      const updated = await physicalCountService.removePhysicalCountMaterials(count.id, {
        materialIds: [materialId],
      })
      setCount(updated)
      notify.success(t('inventory.physicalCounts.toast.removeMaterialSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStart() {
    if (!count) return
    setActionLoading(true)
    try {
      const updated = await physicalCountService.startPhysicalCount(count.id)
      setCount(updated)
      setStartConfirmOpen(false)
      notify.success(t('inventory.physicalCounts.toast.startSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!count) return
    setActionLoading(true)
    try {
      const updated = await physicalCountService.cancelPhysicalCount(count.id, {
        reason: cancelReason.trim() || undefined,
      })
      setCount(updated)
      setCancelModalOpen(false)
      setCancelReason('')
      notify.success(t('inventory.physicalCounts.toast.cancelSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSaveCountedQuantities(
    lines: Array<{ lineId: number; countedQuantity: number; notes?: string }>,
  ) {
    if (!count || lines.length === 0) {
      setCountSaveError(t('inventory.physicalCounts.counting.nothingToSave'))
      return
    }

    setCountSaveLoading(true)
    setCountSaveError('')
    try {
      const updated = await physicalCountService.updateCountedQuantities(count.id, { lines })
      setCount(updated)
      setCountSavedAt(updated.updatedAt ?? new Date().toISOString())
      notify.success(t('inventory.physicalCounts.toast.saveCountedSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setCountSaveLoading(false)
    }
  }

  function handleProceedToReconcile() {
    setSearchParams({ stage: 'reconcile' })
  }

  function handleBackToCounting() {
    setSearchParams({})
    setReconcileError('')
  }

  async function handleRevertToDraft() {
    if (!count) return
    setActionLoading(true)
    try {
      await physicalCountService.revertPhysicalCountToDraft(count.id)
      setSearchParams({})
      setRevertModalOpen(false)
      await loadCount()
      notify.success(t('inventory.physicalCounts.toast.revertToDraftSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteCount() {
    if (!count) return
    setActionLoading(true)
    try {
      await physicalCountService.deletePhysicalCount(count.id)
      setDeleteModalOpen(false)
      notify.success(t('inventory.physicalCounts.toast.deleteSuccess'))
      navigate('/inventory/physical-counts')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReconcile(lines: Array<{ lineId: number; action: ReconcileLineAction }>) {
    if (!count) return
    setReconcileLoading(true)
    setReconcileError('')
    try {
      const updated = await physicalCountService.reconcilePhysicalCount(count.id, { lines })
      setCount(updated)
      setSearchParams({})
      notifyStockBalancesRefresh()
      notify.success(t('inventory.physicalCounts.toast.reconcileSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setReconcileLoading(false)
    }
  }

  if (!canView) return <StockAccessDenied />

  if (loading) {
    return (
      <ListPage>
        <div className="page-loading">{t('common.loading')}</div>
      </ListPage>
    )
  }

  if (error || !count) {
    return (
      <ListPage>
        <div className="page-error-banner">{error || t('common.notFound')}</div>
        <Button variant="secondary" onClick={() => navigate('/inventory/physical-counts')}>
          {t('inventory.physicalCounts.form.backToList')}
        </Button>
      </ListPage>
    )
  }

  const existingMaterialIds = count.lines.map((line) => line.materialId)

  function renderDetailView(current: PhysicalCountResponse) {
    if (current.status === 'DRAFT') {
      return (
        <PhysicalCountDraftView
          count={current}
          locale={locale}
          canManage={canManage}
          canDelete={canDelete}
          actionLoading={actionLoading}
          onAddMaterials={() => setPickerOpen(true)}
          onRemoveMaterial={(materialId) => void handleRemoveMaterial(materialId)}
          onStart={() => setStartConfirmOpen(true)}
          onCancel={() => setCancelModalOpen(true)}
          onDelete={() => setDeleteModalOpen(true)}
          t={t}
        />
      )
    }

    if (current.status === 'IN_PROGRESS') {
      if (isReconcileStage && allLinesCounted) {
        return (
          <PhysicalCountReconcileView
            count={current}
            locale={locale}
            canManage={canManage}
            canRevert={canRevert}
            canDelete={canDelete}
            actionLoading={actionLoading}
            reconciling={reconcileLoading}
            reconcileError={reconcileError}
            onReconcile={(lines) => void handleReconcile(lines)}
            onBackToCounting={handleBackToCounting}
            onRevertToDraft={() => setRevertModalOpen(true)}
            onDelete={() => setDeleteModalOpen(true)}
            t={t}
          />
        )
      }

      return (
        <PhysicalCountInProgressView
          count={current}
          locale={locale}
          canManage={canManage}
          canRevert={canRevert}
          canDelete={canDelete}
          actionLoading={actionLoading}
          saving={countSaveLoading}
          savedAt={countSavedAt}
          saveError={countSaveError}
          onSave={(lines) => void handleSaveCountedQuantities(lines)}
          onProceedToReconcile={handleProceedToReconcile}
          onRevertToDraft={() => setRevertModalOpen(true)}
          onDelete={() => setDeleteModalOpen(true)}
          t={t}
        />
      )
    }

    if (current.status === 'RECONCILED') {
      return <PhysicalCountReconciledView count={current} locale={locale} t={t} />
    }

    if (current.status === 'CANCELLED') {
      return <PhysicalCountCancelledView count={current} t={t} />
    }

    return <PhysicalCountPlaceholderView count={current} t={t} />
  }

  return (
    <ListPage className="physical-count-view-page">
      <PageHeader
        title={t('inventory.physicalCounts.form.viewTitle')}
        description={t('inventory.physicalCounts.form.viewSubtitle')}
        action={
          <Link to="/inventory/physical-counts">
            <Button variant="secondary" type="button">{t('inventory.physicalCounts.form.backToList')}</Button>
          </Link>
        }
      />

      {renderDetailView(count)}

      <PhysicalCountMaterialPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(materialIds) => void handleAddMaterials(materialIds)}
        excludeMaterialIds={existingMaterialIds}
        loading={actionLoading}
      />

      <ConfirmModal
        open={startConfirmOpen}
        title={t('inventory.physicalCounts.confirm.startTitle')}
        message={t('inventory.physicalCounts.confirm.startMessage')}
        confirmLabel={t('inventory.physicalCounts.confirm.startConfirm')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setStartConfirmOpen(false)}
        onConfirm={() => void handleStart()}
      />

      <ConfirmModal
        open={revertModalOpen}
        title={t('inventory.physicalCounts.confirm.revertToDraftTitle')}
        message={t('inventory.physicalCounts.confirm.revertToDraftMessage')}
        confirmLabel={t('inventory.physicalCounts.confirm.revertToDraftConfirm')}
        cancelLabel={t('inventory.physicalCounts.confirm.back')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setRevertModalOpen(false)}
        onConfirm={() => void handleRevertToDraft()}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title={t('inventory.physicalCounts.confirm.deleteTitle')}
        message={
          count?.status === 'IN_PROGRESS'
            ? t('inventory.physicalCounts.confirm.deleteMessageInProgress')
            : t('inventory.physicalCounts.confirm.deleteMessage')
        }
        confirmLabel={t('inventory.physicalCounts.confirm.deleteConfirm')}
        cancelLabel={t('inventory.physicalCounts.confirm.back')}
        confirmVariant="dangerConfirm"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteCount()}
      />

      <Modal
        open={cancelModalOpen}
        title={t('inventory.physicalCounts.confirm.cancelTitle')}
        onClose={() => {
          if (actionLoading) return
          setCancelModalOpen(false)
          setCancelReason('')
        }}
        size="default"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setCancelModalOpen(false)
                setCancelReason('')
              }}
              disabled={actionLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="dangerConfirm"
              onClick={() => void handleCancel()}
              disabled={actionLoading}
            >
              {actionLoading ? t('common.loading') : t('inventory.physicalCounts.confirm.cancelConfirm')}
            </Button>
          </>
        }
      >
        <p className="confirm-modal-message">{t('inventory.physicalCounts.confirm.cancelMessage')}</p>
        <FormField label={t('inventory.physicalCounts.fields.cancelReason')}>
          <FormTextarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            disabled={actionLoading}
            rows={2}
          />
        </FormField>
      </Modal>
    </ListPage>
  )
}

interface PhysicalCountDraftViewProps {
  count: PhysicalCountResponse
  locale: string
  canManage: boolean
  canDelete: boolean
  actionLoading: boolean
  onAddMaterials: () => void
  onRemoveMaterial: (materialId: number) => void
  onStart: () => void
  onCancel: () => void
  onDelete: () => void
  t: (key: string) => string
}

function PhysicalCountDraftView({
  count,
  locale,
  canManage,
  canDelete,
  actionLoading,
  onAddMaterials,
  onRemoveMaterial,
  onStart,
  onCancel,
  onDelete,
  t,
}: PhysicalCountDraftViewProps) {
  return (
    <>
      <div className="physical-count-detail">
        <div className="physical-count-detail__header">
          <div className="physical-count-detail__info">
            <div className="physical-count-detail__code" dir="ltr">{count.code}</div>
            <div className="physical-count-detail__warehouse">{count.warehouseName}</div>
            <div className="physical-count-detail__meta-inline">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
              <span className="physical-count-detail__meta-value" dir="ltr">{formatDate(count.scheduledDate)}</span>
            </div>
            {count.notes ? (
              <div className="physical-count-detail__notes">
                <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
                <span className="physical-count-detail__meta-value">{count.notes}</span>
              </div>
            ) : null}
          </div>
          <Badge variant={getStatusVariantForDraft(count.status)}>
            {t(`inventory.physicalCounts.status.${count.status}`)}
          </Badge>
        </div>

        <div className="physical-count-detail__lines">
          <div className="form-section__header">
            <h3 className="physical-count-detail__lines-title">{t('inventory.physicalCounts.lines.title')}</h3>
            {canManage ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onAddMaterials}
                disabled={actionLoading}
              >
                <Plus size={16} aria-hidden />
                {t('inventory.physicalCounts.actions.addMaterials')}
              </Button>
            ) : null}
          </div>

          {count.lines.length === 0 ? (
            <div className="physical-count-detail__no-lines">
              {t('inventory.physicalCounts.lines.draftEmpty')}
            </div>
          ) : (
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.physicalCounts.lines.material')}</Th>
                  <Th>{t('inventory.physicalCounts.lines.uom')}</Th>
                  {canManage ? <Th>{t('inventory.col.actions')}</Th> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {count.lines.map((line) => (
                  <TableRow key={line.id}>
                    <Td column="entity">
                      <span>
                        {locale === 'ar' && line.materialNameAr
                          ? line.materialNameAr
                          : line.materialName}
                      </span>
                      <span className="entity-cell__code">{line.materialCode}</span>
                    </Td>
                    <Td>{line.uomSymbol}</Td>
                    {canManage ? (
                      <StopPropagationCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="action"
                          className="action-btn action-btn--icon action-btn--cancel"
                          aria-label={t('inventory.physicalCounts.actions.removeMaterial')}
                          onClick={() => onRemoveMaterial(line.materialId)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </StopPropagationCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </div>
      </div>

      {canManage || canDelete ? (
        <div className="physical-count-detail__actions">
          {canManage ? (
            <>
              <Button variant="primary" onClick={onStart} disabled={actionLoading || count.lines.length === 0}>
                {t('inventory.physicalCounts.actions.start')}
              </Button>
              <Button variant="secondary" onClick={onCancel} disabled={actionLoading}>
                {t('inventory.physicalCounts.actions.cancel')}
              </Button>
            </>
          ) : null}
          {canDelete ? (
            <IconActionButton
              className="action-btn action-btn--icon action-btn--cancel"
              label={t('inventory.physicalCounts.actions.delete')}
              onClick={onDelete}
              disabled={actionLoading}
            >
              <Trash2 size={16} aria-hidden />
            </IconActionButton>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

interface PhysicalCountPlaceholderViewProps {
  count: PhysicalCountResponse
  t: (key: string) => string
}

function PhysicalCountPlaceholderView({ count, t }: PhysicalCountPlaceholderViewProps) {
  return (
    <div className="physical-count-detail">
      <div className="physical-count-detail__header">
        <div className="physical-count-detail__info">
          <div className="physical-count-detail__code" dir="ltr">{count.code}</div>
          <div className="physical-count-detail__warehouse">{count.warehouseName}</div>
          <div className="physical-count-detail__meta-inline">
            <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.col.scheduledDate')}</span>
            <span className="physical-count-detail__meta-value" dir="ltr">{formatDate(count.scheduledDate)}</span>
          </div>
          {count.notes ? (
            <div className="physical-count-detail__notes">
              <span className="physical-count-detail__meta-label">{t('inventory.physicalCounts.fields.notes')}</span>
              <span className="physical-count-detail__meta-value">{count.notes}</span>
            </div>
          ) : null}
        </div>
        <Badge variant={getStatusVariant(count.status)}>
          {t(`inventory.physicalCounts.status.${count.status}`)}
        </Badge>
      </div>

      <div className="physical-count-detail__placeholder">
        <p className="physical-count-detail__placeholder-title">
          {t('inventory.physicalCounts.placeholder.comingSoonTitle')}
        </p>
        <p className="physical-count-detail__placeholder-text">
          {t('inventory.physicalCounts.placeholder.comingSoonMessage')}
        </p>
      </div>
    </div>
  )
}
