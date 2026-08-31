import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Loader2,
  Pencil,
  Send,
  Undo2,
  X,
  XCircle,
} from 'lucide-react'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { ListPage } from '../../../components/ui/ListPage'
import { Modal } from '../../../components/ui/Modal'
import { IconActionButton } from '../../../components/ui/RowActions'
import { useNotify } from '../../../components/ui/NotificationContext'
import { DetailField, FormField, FormTextarea } from '../../../components/fields'
import { DocumentHeader } from '../../../components/layout/DocumentLayout'
import { SchemaDocumentLinesCard } from '../../../components/layout/DocumentLayout/SchemaDocumentLinesCard'
import { createWasteDocumentLineSchema } from '../../../schemas/wasteDocumentLineSchema'
import type { WasteDocumentLineFormState } from '../../../schemas/wasteDocumentLineSchema'
import { useDocumentLines, type LineOpResult } from '../../../hooks/useDocumentLines'
import { useUomLookup } from '../../../hooks/useUomLookup'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as wasteDocumentService from '../../../services/wasteDocumentService'
import type { MaterialResponse, UomResponse, WarehouseResponse } from '../../../types/inventory'
import {
  WASTE_REASON_CODES,
  type DocumentStatus,
  type WasteDocumentResponse,
  type WasteLineResponse,
  type WasteLineRequest,
  type WasteReasonCode,
  type WasteUpdateLineRequest,
} from '../../../types/wasteDocument'
import { translateApiError } from '../../../utils/errors'
import { formatDate, todayLocalDate } from '../../../utils/format'
import { canManageInventoryStock, canUncompleteWasteDocuments, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { StockAccessDenied } from '../StockAccessDenied'
import { WasteDocumentStatusPill } from './WasteDocumentStatusPill'
import { WasteDocumentStockWarnings } from './WasteDocumentStockWarnings'

type HeaderFormState = {
  warehouseId: string
  wasteDate: string
  reasonCode: WasteReasonCode
  notes: string
}

type FieldErrors = {
  warehouseId?: string
  wasteDate?: string
}

type FormMode = 'create' | 'detail'

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function emptyHeader(): HeaderFormState {
  return {
    warehouseId: '',
    wasteDate: todayLocalDate(),
    reasonCode: 'SPOILED',
    notes: '',
  }
}

function createEmptyLineForm(): WasteDocumentLineFormState {
  return {
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

function mapLineToForm(line: WasteLineResponse): WasteDocumentLineFormState {
  return {
    id: line.id,
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

  const { uoms: cachedUoms } = useUomLookup()
  const [document, setDocument] = useState<WasteDocumentResponse | null>(null)
  const [header, setHeader] = useState<HeaderFormState>(emptyHeader())
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const uoms = cachedUoms as unknown as UomResponse[]
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [loading, setLoading] = useState(!isCreate)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [actionLoading, setActionLoading] = useState(false)

  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)
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
  const startEditLineRef = useRef<(line: WasteDocumentLineFormState) => void>(() => undefined)
  const deleteLineRef = useRef<(lineId: number) => void>(() => undefined)
  const handleSchemaEditLine = useCallback(
    (line: WasteDocumentLineFormState) => startEditLineRef.current(line),
    [],
  )
  const handleSchemaDeleteLine = useCallback(
    (line: WasteDocumentLineFormState) => deleteLineRef.current(line.id!),
    [],
  )

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

  const schema = useMemo(
    () =>
      // Schema actions run only from user events; the refs keep the factory stable
      // while dispatching to the current hook controller.
      // eslint-disable-next-line react-hooks/refs
      createWasteDocumentLineSchema({
        lookups: { materials, uoms },
        locale,
        t,
        handlers: {
          onEditLine: handleSchemaEditLine,
          onDeleteLine: handleSchemaDeleteLine,
        },
      }),
    [materials, uoms, locale, t, handleSchemaEditLine, handleSchemaDeleteLine],
  )

  const initialLineForms = useMemo(
    () => (document?.lines ?? []).map(mapLineToForm),
    [document?.lines],
  )

  const lineController = useDocumentLines<
    WasteDocumentLineFormState,
    { materials: MaterialResponse[]; uoms: UomResponse[] }
  >({
    schema,
    initialLines: initialLineForms,
    linesReady: !loading,
    lookups: { materials, uoms },
    locale,
    t,
    onAddLine: async (payload) => {
      if (!persistedId) throw new Error('Waste document must be persisted before adding a line')
      const updated = await wasteDocumentService.addWasteLine(
        persistedId,
        payload as WasteLineRequest,
      )
      setDocument(updated)
      return updated.lines.map(mapLineToForm)
    },
    onUpdateLine: async (lineId, payload) => {
      if (!persistedId) throw new Error('Waste document must be persisted before updating a line')
      const updated = await wasteDocumentService.updateWasteLine(
        persistedId,
        lineId,
        payload as WasteUpdateLineRequest,
      )
      setDocument(updated)
      return updated.lines.map(mapLineToForm)
    },
    onDeleteLine: async (lineId) => {
      if (!persistedId) throw new Error('Waste document must be persisted before deleting a line')
      const updated = await wasteDocumentService.deleteWasteLine(persistedId, lineId)
      setDocument(updated)
      return updated.lines.map(mapLineToForm)
    },
  })

  const {
    lines,
    editingLineId,
    editLineForm,
    addingLine,
    newLineForm,
    lineSaving,
    fieldErrors: lineFieldErrors,
    startAddLine,
    startEditLine,
    cancelLineAction,
    updateFormValue,
    saveNewLine,
    saveEditLine,
    deleteLine,
  } = lineController

  const handleLineResult = useCallback(
    (result: LineOpResult<WasteDocumentLineFormState>, successKey: string) => {
      if (result.ok) {
        notify.success(t(successKey))
        return
      }
      switch (result.kind) {
        case 'validation':
          return
        case 'api':
          // The global axios interceptor is the single translated API-error channel.
          return
        default: {
          const exhaustive: never = result
          return exhaustive
        }
      }
    },
    [notify, t],
  )

  useEffect(() => {
    startEditLineRef.current = startEditLine
    deleteLineRef.current = (lineId) => {
      if (!persistedId || !isDraft) return
      void deleteLine(lineId).then((result) => {
        handleLineResult(result, 'inventory.waste.toast.lineDeleteSuccess')
      })
    }
  }, [startEditLine, persistedId, isDraft, deleteLine, handleLineResult])

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
      const [warehouseData, materialData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getMaterials({ active: true }),
      ])
      setWarehouses(warehouseData)
      setMaterials(materialData)
    } catch {
      setWarehouses([])
      setMaterials([])
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
    startAddLine(createEmptyLineForm())
  }

  async function handleSaveNewLine() {
    const result = await saveNewLine((form) => ({
      materialId: Number(form.materialId),
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      notes: form.notes?.trim() || undefined,
    }))
    handleLineResult(result, 'inventory.waste.toast.lineAddSuccess')
  }

  async function handleSaveEditLine(lineId: number) {
    const result = await saveEditLine(lineId, (form) => ({
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      notes: form.notes?.trim() || undefined,
    }))
    handleLineResult(result, 'inventory.waste.toast.lineUpdateSuccess')
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

  return (
    <ListPage className="waste-document-detail-page purchase-invoice-form-page purchase-invoice-form-page--redesign">
      {loading ? (
        <div className="pi-form-header-card">
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
            noValidate
          >
            <DocumentHeader
              title={
                isCreate ? t('inventory.waste.form.createTitle') : t('inventory.waste.form.viewTitle')
              }
              statusBadge={<WasteDocumentStatusPill status={displayStatus} />}
              actions={
                showFormActions ? (
                  <>
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
                  </>
                ) : null
              }
              reference={
                persistedId && document?.code ? (
                  <span className="pi-form-header-card__invoice-number" dir="ltr">
                    {document.code}
                  </span>
                ) : null
              }
            >
              <div className="pi-form-header-grid">
                {headerInputsDisabled ? (
                  <>
                    <DetailField
                      label={t('inventory.waste.fields.warehouse')}
                      value={
                        warehouseOptions.find((opt) => opt.value === header.warehouseId)?.label ??
                        document?.warehouseName ??
                        '—'
                      }
                    />
                    <DetailField
                      label={t('inventory.waste.fields.wasteDate')}
                      value={header.wasteDate}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.waste.fields.reasonCode')}
                      value={header.reasonCode ? t(`inventory.waste.reasonCode.${header.reasonCode}`) : '—'}
                    />
                    <DetailField
                      label={t('inventory.waste.fields.notes')}
                      value={header.notes?.trim() || '—'}
                      fullWidth
                    />
                    {document?.completedAt ? (
                      <DetailField
                        label={t('inventory.waste.fields.completedAt')}
                        value={formatDate(document.completedAt)}
                        dir="ltr"
                      />
                    ) : null}
                  </>
                ) : (
                  <>
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
                        rows={2}
                      />
                    </PiFormField>
                  </>
                )}
              </div>
            </DocumentHeader>

            <SchemaDocumentLinesCard
              title={t('inventory.waste.lines.title')}
              schema={schema}
              lines={lines}
              lookups={{ materials, uoms }}
              viewMode={lineController.viewMode}
              selectedLineId={lineController.selectedLineId}
              selectedIndex={lineController.selectedIndex}
              locale={locale}
              t={t}
              showActions={showDraftLineActions}
              editingLineId={editingLineId}
              editLineForm={editLineForm}
              addingLine={addingLine}
              newLineForm={newLineForm}
              lineSaving={lineSaving}
              lineError={lineFieldErrors.lineError}
              lookupsLoading={lookupsLoading}
              emptyState={
                <div className="pi-form-lines__empty">
                  <p className="pi-form-lines__empty-title">{t('inventory.waste.lines.empty')}</p>
                </div>
              }
              extraFooter={
                <>
                  {showStockWarnings ? <WasteDocumentStockWarnings warnings={stockWarnings} /> : null}
                  {isComplete && !showStockWarnings ? (
                    <p className="waste-document-post-note">{t('inventory.waste.postNote')}</p>
                  ) : null}
                </>
              }
              onFieldChange={updateFormValue}
              onSaveLine={(lineId) => {
                if (lineId != null) {
                  void handleSaveEditLine(Number(lineId))
                } else {
                  void handleSaveNewLine()
                }
              }}
              onCancelLine={() => {
                cancelLineAction()
              }}
              onStartAddLine={() => void handleAddItemClick()}
              onStartEditLine={startEditLine}
              onViewModeChange={lineController.setViewMode}
              onSelectLine={lineController.selectLine}
            />
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
        confirmVariant="dangerConfirm"
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
