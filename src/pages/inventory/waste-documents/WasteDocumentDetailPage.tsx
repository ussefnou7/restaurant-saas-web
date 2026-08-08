import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
  X,
  XCircle,
} from 'lucide-react'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { ListPage } from '../../../components/ui/ListPage'
import { MaterialSelect } from '../../../components/ui/MaterialSelect'
import { Modal } from '../../../components/ui/Modal'
import { IconActionButton } from '../../../components/ui/RowActions'
import { useNotify } from '../../../components/ui/NotificationContext'
import { FormField, FormTextarea } from '../../../components/fields'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as wasteDocumentService from '../../../services/wasteDocumentService'
import type { MaterialResponse, UomResponse, WarehouseResponse } from '../../../types/inventory'
import {
  WASTE_REASON_CODES,
  type DocumentStatus,
  type WasteDocumentResponse,
  type WasteLineResponse,
  type WasteReasonCode,
} from '../../../types/wasteDocument'
import { translateApiError } from '../../../utils/errors'
import { formatDate } from '../../../utils/format'
import { canManageInventoryStock, canUncompleteWasteDocuments, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { getCompatibleUoms, resolveStockUomId } from '../../../utils/inventoryUom'
import { StockAccessDenied } from '../StockAccessDenied'
import { WasteDocumentStatusPill } from './WasteDocumentStatusPill'
import { WasteDocumentStockWarnings } from './WasteDocumentStockWarnings'

type HeaderFormState = {
  warehouseId: string
  wasteDate: string
  reasonCode: WasteReasonCode
  notes: string
}

type LineFormState = {
  clientId: string
  materialId: string
  quantity: string
  uomId: string
  notes: string
}

type FieldErrors = {
  warehouseId?: string
  wasteDate?: string
  lineError?: string
}

type FormMode = 'create' | 'detail'

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function emptyHeader(): HeaderFormState {
  return {
    warehouseId: '',
    wasteDate: todayDateInput(),
    reasonCode: 'SPOILED',
    notes: '',
  }
}

function createEmptyLineForm(): LineFormState {
  return {
    clientId: crypto.randomUUID(),
    materialId: '',
    quantity: '',
    uomId: '',
    notes: '',
  }
}

function mapDocumentToHeader(doc: WasteDocumentResponse): HeaderFormState {
  return {
    warehouseId: String(doc.warehouseId),
    wasteDate: toDateInputValue(doc.wasteDate),
    reasonCode: doc.reasonCode,
    notes: doc.notes ?? '',
  }
}

function mapLineToForm(line: WasteLineResponse): LineFormState {
  return {
    clientId: String(line.id),
    materialId: String(line.materialId),
    quantity: String(line.quantity),
    uomId: String(line.uomId),
    notes: line.notes ?? '',
  }
}

interface PiFormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  children: ReactNode
}

function PiFormField({ label, htmlFor, required, error, children }: PiFormFieldProps) {
  const LabelTag = htmlFor ? 'label' : 'span'
  return (
    <div className={`pi-form-field${error ? ' pi-form-field--error' : ''}`}>
      <LabelTag className="pi-form-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="pi-form-field__required"> *</span> : null}
      </LabelTag>
      {children}
      {error ? <span className="pi-form-field__error">{error}</span> : null}
    </div>
  )
}

function WasteDocumentForm({ mode }: { mode: FormMode }) {
  const { id } = useParams<{ id: string }>()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const canUncomplete = canUncompleteWasteDocuments()

  const isCreate = mode === 'create'

  const [document, setDocument] = useState<WasteDocumentResponse | null>(null)
  const [header, setHeader] = useState<HeaderFormState>(emptyHeader())
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [loading, setLoading] = useState(!isCreate)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [actionLoading, setActionLoading] = useState(false)

  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editLineForm, setEditLineForm] = useState<LineFormState | null>(null)
  const [lineSaving, setLineSaving] = useState(false)
  const [addingLine, setAddingLine] = useState(false)
  const [newLineForm, setNewLineForm] = useState<LineFormState | null>(null)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false)
  const [uncompleteModalOpen, setUncompleteModalOpen] = useState(false)
  const [postConfirmOpen, setPostConfirmOpen] = useState(false)
  const [discardModalOpen, setDiscardModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const persistedId = document != null ? String(document.id) : id
  const displayStatus: DocumentStatus = document?.status ?? 'DRAFT'
  const isDraft = displayStatus === 'DRAFT'
  const isComplete = displayStatus === 'COMPLETE'
  const isReadOnly = displayStatus === 'POSTED' || displayStatus === 'CANCELLED'
  const headerFieldsEnabled = !persistedId || (isDraft && isEditingHeader)
  const headerInputsDisabled =
    !headerFieldsEnabled || headerSaving || lookupsLoading || actionLoading || isReadOnly
  const showDraftLineActions = isDraft && canManage
  const stockWarnings = document?.stockWarnings ?? []
  const showStockWarnings = isComplete && stockWarnings.length > 0

  const isHeaderDirty = useMemo(() => {
    if (!document) return false
    const initial = mapDocumentToHeader(document)
    return (
      header.warehouseId !== initial.warehouseId ||
      header.wasteDate !== initial.wasteDate ||
      header.reasonCode !== initial.reasonCode ||
      header.notes !== initial.notes
    )
  }, [document, header])

  function handleEditButtonClick() {
    if (!isEditingHeader) {
      setIsEditingHeader(true)
    } else {
      if (isHeaderDirty) {
        setPendingNavigation(null)
        setDiscardModalOpen(true)
      } else {
        setIsEditingHeader(false)
        setFieldErrors({})
      }
    }
  }

  function handleBackToListClick() {
    if (isEditingHeader && isHeaderDirty) {
      setPendingNavigation('/inventory/waste-documents')
      setDiscardModalOpen(true)
    } else {
      navigate('/inventory/waste-documents')
    }
  }

  function handleConfirmDiscard() {
    if (document) {
      setHeader(mapDocumentToHeader(document))
    }
    setFieldErrors({})
    setIsEditingHeader(false)
    setDiscardModalOpen(false)
    if (pendingNavigation) {
      const target = pendingNavigation
      setPendingNavigation(null)
      navigate(target)
    }
  }

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const [warehouseData, materialData, uomData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getMaterials({ active: true }),
        inventoryService.getUoms(true),
      ])
      setWarehouses(warehouseData)
      setMaterials(materialData)
      setUoms(uomData)
    } catch {
      setWarehouses([])
      setMaterials([])
      setUoms([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const loadDocument = useCallback(async (targetId: string) => {
    setError('')
    try {
      const data = await wasteDocumentService.getWasteDocument(targetId)
      setDocument(data)
      setHeader(mapDocumentToHeader(data))
      setIsEditingHeader(false)
      setEditingLineId(null)
      setEditLineForm(null)
      setAddingLine(false)
      setNewLineForm(null)
    } catch (err) {
      setDocument(null)
      setError(translateApiError(err, t).message)
    }
  }, [t])

  useEffect(() => {
    if (!canView) return
    void loadLookups()
  }, [canView, loadLookups])

  useEffect(() => {
    if (!canView || isCreate || !id) return
    setLoading(true)
    void loadDocument(id).finally(() => setLoading(false))
  }, [canView, isCreate, id, loadDocument])

  function validateHeader(): FieldErrors {
    const errors: FieldErrors = {}
    const fieldRequired = t('inventory.waste.validation.fieldRequired')
    if (!header.warehouseId) errors.warehouseId = fieldRequired
    if (!header.wasteDate) errors.wasteDate = fieldRequired
    return errors
  }

  function validateLineForm(form: LineFormState, requireMaterial = true): string | null {
    if (requireMaterial && !form.materialId) {
      return t('inventory.waste.validation.fieldRequired')
    }
    const quantity = Number(form.quantity)
    if (!form.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
      return t('inventory.waste.validation.quantityRequired')
    }
    if (!form.uomId) return t('inventory.waste.validation.uomRequired')
    return null
  }

  async function handleSaveHeader() {
    if (!isDraft) return
    const validationErrors = validateHeader()
    if (validationErrors.warehouseId || validationErrors.wasteDate) {
      setFieldErrors(validationErrors)
      return
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      if (!persistedId) {
        const created = await wasteDocumentService.createWasteDocument({
          warehouseId: Number(header.warehouseId),
          wasteDate: header.wasteDate,
          reasonCode: header.reasonCode,
          notes: header.notes.trim() || undefined,
        })
        setDocument(created)
        setHeader(mapDocumentToHeader(created))
        notify.success(t('inventory.waste.toast.createSuccess'))
        navigate(`/inventory/waste-documents/${created.id}`, { replace: true })
        return
      }
      const updated = await wasteDocumentService.updateWasteDocument(persistedId, {
        warehouseId: Number(header.warehouseId),
        wasteDate: header.wasteDate,
        reasonCode: header.reasonCode,
        notes: header.notes.trim() || undefined,
      })
      setDocument(updated)
      setHeader(mapDocumentToHeader(updated))
      setIsEditingHeader(false)
      notify.success(t('inventory.waste.toast.updateSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setHeaderSaving(false)
    }
  }

  async function ensureDocumentPersisted(): Promise<WasteDocumentResponse | null> {
    if (document) return document
    const validationErrors = validateHeader()
    if (validationErrors.warehouseId || validationErrors.wasteDate) {
      setFieldErrors(validationErrors)
      return null
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      const created = await wasteDocumentService.createWasteDocument({
        warehouseId: Number(header.warehouseId),
        wasteDate: header.wasteDate,
        reasonCode: header.reasonCode,
        notes: header.notes.trim() || undefined,
      })
      setDocument(created)
      setHeader(mapDocumentToHeader(created))
      notify.success(t('inventory.waste.toast.createSuccess'))
      return created
    } catch {
      return null
    } finally {
      setHeaderSaving(false)
    }
  }

  async function handleAddItemClick() {
    const doc = await ensureDocumentPersisted()
    if (!doc) return
    setAddingLine(true)
    setNewLineForm(createEmptyLineForm())
    setFieldErrors({})
  }

  function handleNewLineMaterialChange(materialId: string) {
    const material = materials.find((m) => String(m.id) === materialId)
    const defaultUomId = material ? String(resolveStockUomId(material)) : ''
    setNewLineForm((prev) => (prev ? { ...prev, materialId, uomId: defaultUomId } : prev))
  }

  async function handleSaveNewLine() {
    if (!persistedId || !newLineForm) return
    const lineError = validateLineForm(newLineForm, true)
    if (lineError) {
      setFieldErrors({ lineError })
      return
    }
    setFieldErrors({})
    setLineSaving(true)
    try {
      const updated = await wasteDocumentService.addWasteLine(persistedId, {
        materialId: Number(newLineForm.materialId),
        quantity: Number(newLineForm.quantity),
        uomId: Number(newLineForm.uomId),
        notes: newLineForm.notes.trim() || undefined,
      })
      setDocument(updated)
      setAddingLine(false)
      setNewLineForm(null)
      notify.success(t('inventory.waste.toast.lineAddSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setLineSaving(false)
    }
  }

  function handleCancelNewLine() {
    setAddingLine(false)
    setNewLineForm(null)
    setFieldErrors({})
  }

  function handleStartEditLine(line: WasteLineResponse) {
    setAddingLine(false)
    setNewLineForm(null)
    setEditingLineId(String(line.id))
    setEditLineForm(mapLineToForm(line))
    setFieldErrors({})
  }

  async function handleSaveEditLine(lineId: number) {
    if (!persistedId || !editLineForm) return
    const lineError = validateLineForm(editLineForm, false)
    if (lineError) {
      setFieldErrors({ lineError })
      return
    }
    setFieldErrors({})
    setLineSaving(true)
    try {
      const updated = await wasteDocumentService.updateWasteLine(persistedId, lineId, {
        quantity: Number(editLineForm.quantity),
        uomId: Number(editLineForm.uomId),
        notes: editLineForm.notes.trim() || undefined,
      })
      setDocument(updated)
      setEditingLineId(null)
      setEditLineForm(null)
      notify.success(t('inventory.waste.toast.lineUpdateSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setLineSaving(false)
    }
  }

  function handleCancelEditLine() {
    setEditingLineId(null)
    setEditLineForm(null)
    setFieldErrors({})
  }

  async function handleDeleteLine(lineId: number) {
    if (!persistedId || !isDraft) return
    setLineSaving(true)
    try {
      const updated = await wasteDocumentService.deleteWasteLine(persistedId, lineId)
      setDocument(updated)
      if (editingLineId === String(lineId)) {
        setEditingLineId(null)
        setEditLineForm(null)
      }
      notify.success(t('inventory.waste.toast.lineDeleteSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setLineSaving(false)
    }
  }

  async function handleComplete() {
    if (!persistedId || !isDraft) return
    setActionLoading(true)
    try {
      const updated = await wasteDocumentService.completeWasteDocument(persistedId)
      setDocument(updated)
      setHeader(mapDocumentToHeader(updated))
      setIsEditingHeader(false)
      setCompleteConfirmOpen(false)
      notify.success(t('inventory.waste.toast.completeSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePost() {
    if (!persistedId || !isComplete) return
    setActionLoading(true)
    try {
      const updated = await wasteDocumentService.postWasteDocument(persistedId)
      setDocument(updated)
      setPostConfirmOpen(false)
      notify.success(t('inventory.waste.toast.postSuccess'))
      notifyStockBalancesRefresh()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUncomplete(reason?: string) {
    if (!persistedId || !isComplete) return
    setActionLoading(true)
    try {
      await wasteDocumentService.uncompleteWasteDocument(persistedId, reason)
      await loadDocument(persistedId)
      notify.success(t('inventory.waste.toast.uncompleteSuccess'))
      setUncompleteModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!persistedId || isReadOnly) return
    setActionLoading(true)
    try {
      const updated = await wasteDocumentService.cancelWasteDocument(persistedId, {
        reason: cancelReason.trim() || undefined,
      })
      setDocument(updated)
      setCancelModalOpen(false)
      setCancelReason('')
      notify.success(t('inventory.waste.toast.cancelSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  if (!canView) return <StockAccessDenied />

  const warehouseOptions = warehouses.map((w) => ({
    value: String(w.id),
    label: getInventoryLocalizedName(w, locale),
  }))

  const showFormActions =
    isCreate ||
    (document != null && !isReadOnly && (canManage || (canUncomplete && isComplete)))

  function renderLineEditCells(
    form: LineFormState,
    options: {
      materialReadOnly?: WasteLineResponse
      onMaterialChange?: (materialId: string) => void
      onChange: (patch: Partial<LineFormState>) => void
      onSave: () => void
      onCancel: () => void
    },
  ) {
    const compatibleUoms = form.uomId
      ? getCompatibleUoms(uoms, Number(form.uomId))
      : uoms.filter((u) => u.active)

    return (
      <>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--material">
          {options.materialReadOnly ? (
            <div className="pi-form-view-line__material">
              <span className="pi-form-view-line__name">
                {getInventoryLocalizedName(
                  {
                    name: options.materialReadOnly.materialName,
                    nameAr: options.materialReadOnly.materialNameAr,
                    code: options.materialReadOnly.materialCode,
                  },
                  locale,
                )}
              </span>
              <span className="entity-cell__code">{options.materialReadOnly.materialCode}</span>
            </div>
          ) : (
            <MaterialSelect
              value={form.materialId}
              onChange={(materialId) => options.onMaterialChange?.(materialId)}
              materials={materials}
              locale={locale}
              disabled={lineSaving}
              loading={lookupsLoading}
              hasError={Boolean(fieldErrors.lineError && !form.materialId)}
              placeholder={t('inventory.waste.lines.selectMaterial')}
              searchPlaceholder={t('common.search')}
              ariaLabel={t('inventory.waste.lines.material')}
            />
          )}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
          <input
            type="number"
            min={0}
            step="any"
            className="pi-form-line-row__input pi-form-line-row__input--ltr"
            value={form.quantity}
            onChange={(e) => options.onChange({ quantity: e.target.value })}
            disabled={lineSaving}
            aria-label={t('inventory.waste.lines.quantity')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--uom">
          <select
            className="pi-form-line-row__input pi-form-line-row__input--uom"
            value={form.uomId}
            onChange={(e) => options.onChange({ uomId: e.target.value })}
            disabled={lineSaving || lookupsLoading || !form.materialId}
            aria-label={t('inventory.waste.lines.uom')}
          >
            <option value="">{t('inventory.common.selectUom')}</option>
            {compatibleUoms.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.symbol ?? getInventoryLocalizedName(u, locale)}
              </option>
            ))}
          </select>
        </td>
        <td className="pi-form-lines-table__td">
          <input
            type="text"
            className="pi-form-line-row__input"
            value={form.notes}
            onChange={(e) => options.onChange({ notes: e.target.value })}
            disabled={lineSaving}
            aria-label={t('inventory.waste.lines.notes')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--actions">
          <div className="pi-form-lines-table__row-actions">
            <IconActionButton
              className="action-btn action-btn--icon action-btn--confirm"
              label={t('inventory.waste.form.save')}
              onClick={options.onSave}
              disabled={lineSaving}
            >
              <Check size={16} aria-hidden />
            </IconActionButton>
            <IconActionButton
              className="action-btn action-btn--icon action-btn--cancel"
              label={t('common.cancel')}
              onClick={options.onCancel}
              disabled={lineSaving}
            >
              <X size={16} aria-hidden />
            </IconActionButton>
          </div>
        </td>
      </>
    )
  }

  return (
    <ListPage className="waste-document-detail-page purchase-invoice-form-page purchase-invoice-form-page--redesign">
      {loading ? (
        <div className="pi-form-header-card" dir="rtl">
          <div className="pi-form-header-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pi-form-field">
                <div className="pi-form-field__skeleton" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      {!loading && (isCreate || document) ? (
        <>
          {displayStatus === 'POSTED' ? (
            <div className="alert-success purchase-invoice-posted-banner">
              {t('inventory.waste.postedBanner')}
              {document?.postedAt ? (
                <span className="purchase-invoice-posted-banner__date" dir="ltr">
                  {' '}
                  · {formatDate(document.postedAt)}
                </span>
              ) : null}
            </div>
          ) : null}

          {displayStatus === 'CANCELLED' ? (
            <div className="waste-document-cancelled-banner">
              {t('inventory.waste.cancelledBanner')}
              {document?.cancelledAt ? (
                <span dir="ltr"> · {formatDate(document.cancelledAt)}</span>
              ) : null}
            </div>
          ) : null}

          <form
            className="pi-form"
            onSubmit={(event: FormEvent) => event.preventDefault()}
            dir="rtl"
            noValidate
          >
            <section className="pi-form-header-card" dir="rtl">
              <div className="pi-form-header-card__topbar">
                <div className="pi-form-header-card__topbar-start">
                  <h1 className="pi-form-topbar__title">
                    {isCreate ? t('inventory.waste.form.createTitle') : t('inventory.waste.form.viewTitle')}
                  </h1>
                  <WasteDocumentStatusPill status={displayStatus} />
                </div>
                <div className="pi-form-header-card__topbar-end">
                  {showFormActions ? (
                    <div className="pi-form-topbar__actions-bar">
                      {canManage && persistedId && isDraft ? (
                        <Button
                          variant="primary"
                          disabled={
                            headerSaving ||
                            actionLoading ||
                            lineSaving ||
                            isEditingHeader ||
                            addingLine ||
                            editingLineId != null ||
                            (document?.lines?.length ?? 0) === 0
                          }
                          onClick={() => setCompleteConfirmOpen(true)}
                        >
                          <span className="pi-form-actions__icon-text">
                            <CheckCircle size={18} aria-hidden="true" />
                            {t('inventory.waste.actions.complete')}
                          </span>
                        </Button>
                      ) : null}
                      {canManage && persistedId && isComplete ? (
                        <Button
                          variant="post"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setPostConfirmOpen(true)}
                        >
                          <span className="pi-form-actions__icon-text">
                            <Send size={18} aria-hidden="true" />
                            {t('inventory.waste.actions.post')}
                          </span>
                        </Button>
                      ) : null}
                      {canUncomplete && persistedId && isComplete ? (
                        <Button
                          variant="unpost"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setUncompleteModalOpen(true)}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Undo2 size={18} aria-hidden="true" />
                              {t('inventory.waste.actions.uncomplete')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canManage && persistedId && (isDraft || isComplete) ? (
                        <Button
                          variant="cancelDoc"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setCancelModalOpen(true)}
                        >
                          <span className="pi-form-actions__icon-text">
                            <XCircle size={18} aria-hidden="true" />
                            {t('inventory.waste.actions.cancel')}
                          </span>
                        </Button>
                      ) : null}

                      {isDraft && canManage && persistedId ? (
                        isEditingHeader ? (
                          <>
                            <IconActionButton
                              className="action-btn action-btn--icon action-btn--confirm"
                              label={t('inventory.waste.form.saveHeader')}
                              onClick={() => void handleSaveHeader()}
                              disabled={headerSaving}
                            >
                              {headerSaving ? (
                                <Loader2 size={20} className="pi-form-actions__submit-spinner" aria-hidden />
                              ) : (
                                <Check size={20} aria-hidden />
                              )}
                            </IconActionButton>
                            <IconActionButton
                              className="action-btn action-btn--icon action-btn--cancel"
                              label={t('common.cancel')}
                              onClick={handleEditButtonClick}
                              disabled={headerSaving}
                            >
                              <X size={20} aria-hidden />
                            </IconActionButton>
                          </>
                        ) : (
                          <IconActionButton
                            className="action-btn action-btn--icon"
                            label={t('inventory.waste.actions.editHeader')}
                            onClick={handleEditButtonClick}
                            disabled={headerSaving || lineSaving || actionLoading}
                          >
                            <Pencil size={20} aria-hidden />
                          </IconActionButton>
                        )
                      ) : null}

                      <span className="pi-form-topbar__actions-divider" aria-hidden />

                      <IconActionButton
                        className="action-btn action-btn--icon action-btn--header-back"
                        label={t('inventory.waste.form.backToList')}
                        onClick={handleBackToListClick}
                        disabled={headerSaving || lineSaving || actionLoading}
                      >
                        {locale === 'ar' ? <ArrowRight size={20} aria-hidden /> : <ArrowLeft size={20} aria-hidden />}
                      </IconActionButton>
                      {!persistedId ? (
                        <Button
                          variant="primary"
                          disabled={headerSaving || lookupsLoading}
                          onClick={() => void handleSaveHeader()}
                        >
                          {headerSaving ? (
                            <>
                              <Loader2 size={16} className="pi-form-actions__submit-spinner" aria-hidden />
                              {t('common.loading')}
                            </>
                          ) : (
                            t('inventory.waste.form.saveHeader')
                          )}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pi-form-header-card__divider" />

              {persistedId && document?.code ? (
                <div className="pi-form-header-card__invoice-line">
                  <span className="pi-form-header-card__invoice-number" dir="ltr">
                    {document.code}
                  </span>
                </div>
              ) : null}

              <div className="pi-form-header-grid">
                <PiFormField
                  label={t('inventory.waste.fields.warehouse')}
                  required
                  error={fieldErrors.warehouseId}
                >
                  {lookupsLoading ? (
                    <div className="pi-form-field__skeleton" />
                  ) : (
                    <select
                      className="pi-form-field__select"
                      value={header.warehouseId}
                      onChange={(e) => setHeader((prev) => ({ ...prev, warehouseId: e.target.value }))}
                      disabled={headerInputsDisabled}
                    >
                      <option value="">{t('inventory.common.selectWarehouse')}</option>
                      {warehouseOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </PiFormField>

                <PiFormField
                  label={t('inventory.waste.fields.wasteDate')}
                  htmlFor="waste-date"
                  required
                  error={fieldErrors.wasteDate}
                >
                  <input
                    id="waste-date"
                    type="date"
                    className="pi-form-field__input"
                    dir="ltr"
                    value={header.wasteDate}
                    onChange={(e) => setHeader((prev) => ({ ...prev, wasteDate: e.target.value }))}
                    disabled={headerInputsDisabled}
                  />
                </PiFormField>

                <PiFormField label={t('inventory.waste.fields.reasonCode')} required>
                  <select
                    className="pi-form-field__select"
                    value={header.reasonCode}
                    onChange={(e) =>
                      setHeader((prev) => ({
                        ...prev,
                        reasonCode: e.target.value as WasteReasonCode,
                      }))
                    }
                    disabled={headerInputsDisabled}
                  >
                    {WASTE_REASON_CODES.map((code) => (
                      <option key={code} value={code}>
                        {t(`inventory.waste.reasonCode.${code}`)}
                      </option>
                    ))}
                  </select>
                </PiFormField>

                <PiFormField label={t('inventory.waste.fields.notes')} htmlFor="waste-notes">
                  <textarea
                    id="waste-notes"
                    className="pi-form-field__textarea"
                    value={header.notes}
                    onChange={(e) => setHeader((prev) => ({ ...prev, notes: e.target.value }))}
                    disabled={headerInputsDisabled}
                    rows={2}
                  />
                </PiFormField>

                {document?.completedAt ? (
                  <PiFormField label={t('inventory.waste.fields.completedAt')}>
                    <input
                      type="text"
                      className="pi-form-field__input"
                      dir="ltr"
                      value={formatDate(document.completedAt)}
                      disabled
                      readOnly
                    />
                  </PiFormField>
                ) : null}
              </div>
            </section>

            <section className="pi-form-lines-card" dir="rtl">
              <div className="pi-form-lines__header">
                <h2 className="pi-form-lines__title">{t('inventory.waste.lines.title')}</h2>
                {showDraftLineActions && !addingLine && editingLineId == null ? (
                  <button
                    type="button"
                    className="pi-form-lines__add-btn"
                    disabled={lineSaving || actionLoading || isEditingHeader || headerSaving}
                    onClick={() => void handleAddItemClick()}
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t('inventory.waste.lines.add')}
                  </button>
                ) : null}
              </div>

              {fieldErrors.lineError ? (
                <p className="pi-form-lines__inline-error">{fieldErrors.lineError}</p>
              ) : null}

              {showStockWarnings ? <WasteDocumentStockWarnings warnings={stockWarnings} /> : null}

              <div className="pi-form-lines__table-wrap">
                <table
                  className={`pi-form-lines-table${showDraftLineActions ? ' pi-form-lines-table--draft' : ' pi-form-lines-table--readonly'}`}
                >
                  <thead>
                    <tr>
                      <th className="pi-form-lines-table__th">{t('inventory.waste.lines.material')}</th>
                      <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                        {t('inventory.waste.lines.quantity')}
                      </th>
                      <th className="pi-form-lines-table__th pi-form-lines-table__th--uom">
                        {t('inventory.waste.lines.uom')}
                      </th>
                      <th className="pi-form-lines-table__th">{t('inventory.waste.lines.notes')}</th>
                      {showDraftLineActions ? (
                        <th className="pi-form-lines-table__th pi-form-lines-table__th--actions">
                          {t('inventory.col.actions')}
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {addingLine && newLineForm
                      ? (
                          <tr className="pi-form-lines-table__row pi-form-lines-table__row--edit">
                            {renderLineEditCells(newLineForm, {
                              onMaterialChange: handleNewLineMaterialChange,
                              onChange: (patch) =>
                                setNewLineForm((prev) => (prev ? { ...prev, ...patch } : prev)),
                              onSave: () => void handleSaveNewLine(),
                              onCancel: handleCancelNewLine,
                            })}
                          </tr>
                        )
                      : null}

                    {(document?.lines.length ?? 0) === 0 && !addingLine ? (
                      <tr>
                        <td
                          colSpan={showDraftLineActions ? 5 : 4}
                          className="pi-form-lines-table__td pi-form-lines-table__td--empty"
                        >
                          {t('inventory.waste.lines.empty')}
                        </td>
                      </tr>
                    ) : null}

                    {(document?.lines ?? []).map((line) => {
                      const isEditing = editingLineId === String(line.id) && editLineForm
                      if (isEditing && editLineForm) {
                        return (
                          <tr
                            key={line.id}
                            className="pi-form-lines-table__row pi-form-lines-table__row--edit"
                          >
                            {renderLineEditCells(editLineForm, {
                              materialReadOnly: line,
                              onChange: (patch) =>
                                setEditLineForm((prev) => (prev ? { ...prev, ...patch } : prev)),
                              onSave: () => void handleSaveEditLine(line.id),
                              onCancel: handleCancelEditLine,
                            })}
                          </tr>
                        )
                      }

                      return (
                        <tr key={line.id} className="pi-form-lines-table__row">
                          <td className="pi-form-lines-table__td pi-form-lines-table__td--material">
                            <div className="pi-form-view-line__material">
                              <span className="pi-form-view-line__name">
                                {getInventoryLocalizedName(
                                  {
                                    name: line.materialName,
                                    nameAr: line.materialNameAr,
                                    code: line.materialCode,
                                  },
                                  locale,
                                )}
                              </span>
                              <span className="entity-cell__code">{line.materialCode}</span>
                            </div>
                          </td>
                          <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                            {line.quantity}
                          </td>
                          <td className="pi-form-lines-table__td">{line.uomSymbol}</td>
                          <td className="pi-form-lines-table__td">{line.notes?.trim() || '—'}</td>
                          {showDraftLineActions ? (
                            <td className="pi-form-lines-table__td pi-form-lines-table__td--actions">
                              <div className="pi-form-lines-table__row-actions">
                                <IconActionButton
                                  className="action-btn action-btn--icon"
                                  label={t('inventory.waste.actions.editLine')}
                                  onClick={() => handleStartEditLine(line)}
                                  disabled={lineSaving || addingLine || editingLineId != null}
                                >
                                  <Pencil size={16} aria-hidden />
                                </IconActionButton>
                                <IconActionButton
                                  className="action-btn action-btn--icon action-btn--cancel"
                                  label={t('inventory.waste.actions.removeLine')}
                                  onClick={() => void handleDeleteLine(line.id)}
                                  disabled={lineSaving || addingLine || editingLineId != null}
                                >
                                  <Trash2 size={16} aria-hidden />
                                </IconActionButton>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {isComplete && !showStockWarnings ? (
                <p className="waste-document-post-note">{t('inventory.waste.postNote')}</p>
              ) : null}
            </section>
          </form>
        </>
      ) : null}

      <PurchaseDocumentReasonModal
        open={uncompleteModalOpen}
        title={t('inventory.waste.confirm.uncompleteTitle')}
        message={t('inventory.waste.confirm.uncompleteMessage')}
        confirmLabel={t('inventory.waste.confirm.uncompleteConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setUncompleteModalOpen(false)}
        onConfirm={(reason) => void handleUncomplete(reason)}
      />

      <ConfirmModal
        open={completeConfirmOpen}
        title={t('inventory.waste.confirm.completeTitle')}
        message={t('inventory.waste.confirm.completeMessage')}
        confirmLabel={t('inventory.waste.confirm.completeConfirm')}
        confirmVariant="primary"
        loading={actionLoading}
        onConfirm={() => void handleComplete()}
        onClose={() => {
          if (actionLoading) return
          setCompleteConfirmOpen(false)
        }}
      />

      <ConfirmModal
        open={postConfirmOpen}
        title={t('inventory.waste.confirm.postTitle')}
        message={t('inventory.waste.confirm.postMessage')}
        confirmLabel={t('inventory.waste.confirm.postConfirm')}
        loading={actionLoading}
        onConfirm={() => void handlePost()}
        onClose={() => {
          if (actionLoading) return
          setPostConfirmOpen(false)
        }}
      />

      <ConfirmModal
        open={discardModalOpen}
        title={locale === 'ar' ? 'تجاهل التغييرات غير محفوظة؟' : 'Discard unsaved changes?'}
        message={
          locale === 'ar'
            ? 'لديك تغييرات غير محفوظة في بيانات الفاتورة. هل تريد تجاهل هذه التغييرات؟'
            : 'You have unsaved changes in the document header. Are you sure you want to discard them?'
        }
        confirmLabel={locale === 'ar' ? 'تجاهل التغييرات' : 'Discard Changes'}
        cancelLabel={locale === 'ar' ? 'متابعة التعديل' : 'Keep Editing'}
        confirmVariant="danger"
        onClose={() => {
          setDiscardModalOpen(false)
          setPendingNavigation(null)
        }}
        onConfirm={handleConfirmDiscard}
      />

      <Modal
        open={cancelModalOpen}
        title={t('inventory.waste.confirm.cancelTitle')}
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
              {actionLoading ? t('common.loading') : t('inventory.waste.confirm.cancelConfirm')}
            </Button>
          </>
        }
      >
        <p className="confirm-modal-message">{t('inventory.waste.confirm.cancelMessage')}</p>
        <FormField label={t('inventory.waste.fields.cancelReason')}>
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

export function WasteDocumentCreatePage() {
  return <WasteDocumentForm mode="create" />
}

export function WasteDocumentDetailPage() {
  return <WasteDocumentForm mode="detail" />
}
