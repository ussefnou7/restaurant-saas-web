import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle, Loader2, Pencil, Receipt, Send, Trash2, Undo2, X, XCircle } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { DatePicker } from '../../../components/ui/DatePicker'
import { Dropdown } from '../../../components/ui/Dropdown'
import { DetailField } from '../../../components/fields'
import { ListPage } from '../../../components/ui/ListPage'
import { useNotify } from '../../../components/ui/NotificationContext'
import { IconActionButton } from '../../../components/ui/RowActions'
import { Modal } from '../../../components/ui/Modal'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { DetailHeader } from '../../../components/entity-detail/DetailHeader'
import { SchemaDocumentLinesCard } from '../../../components/layout/DocumentLayout/SchemaDocumentLinesCard'
import {
  createPurchaseInvoiceLineSchema,
  type PurchaseInvoiceLineFormState,
} from '../../../schemas/purchaseInvoiceLineSchema'
import { useDocumentLines, type LineOpResult } from '../../../hooks/useDocumentLines'
import { useUomLookup } from '../../../hooks/useUomLookup'
import { PurchaseInvoiceFormStatusPill } from './PurchaseInvoiceFormStatusPill'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import type { MaterialResponse, SupplierResponse, UomResponse, WarehouseResponse } from '../../../types/inventory'
import type {
  BackdatedConsumptionCheckResponse,
  PurchaseInvoiceLineRequest,
  PurchaseInvoiceLineResponse,
  PurchaseInvoiceResponse,
  PurchaseInvoiceStatus,
  UpdatePurchaseInvoiceHeaderRequest,
  UpdatePurchaseInvoiceLineRequest,
} from '../../../types/purchaseInvoice'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney, todayLocalDate } from '../../../utils/format'
import {
  canManagePurchaseInvoices,
  canUnpostPurchaseInvoices,
  canUncompletePurchaseInvoices,
  canViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { PurchaseInvoiceAccessDenied } from './PurchaseInvoiceAccessDenied'

type FormMode = 'create' | 'edit' | 'view'

type HeaderFormState = {
  supplierId: string
  warehouseId: string
  invoiceNumber: string
  invoiceDate: string
  receiptDate: string
  discountAmount: string
  taxAmount: string
  notes: string
}

type FieldErrors = {
  warehouseId?: string
  invoiceDate?: string
  receiptDate?: string
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function emptyHeader(): HeaderFormState {
  return {
    supplierId: '',
    warehouseId: '',
    invoiceNumber: '',
    invoiceDate: todayLocalDate(),
    receiptDate: todayLocalDate(),
    discountAmount: '0',
    taxAmount: '0',
    notes: '',
  }
}

function newLine(): PurchaseInvoiceLineFormState {
  return {
    materialId: '',
    quantity: '',
    uomId: '',
    unitCost: '',
    expiryDate: '',
  }
}

function mapInvoiceToHeader(invoice: PurchaseInvoiceResponse): HeaderFormState {
  return {
    supplierId: invoice.supplierId != null ? String(invoice.supplierId) : '',
    warehouseId: String(invoice.warehouseId),
    invoiceNumber: invoice.invoiceNumber ?? '',
    invoiceDate: toDateInputValue(invoice.invoiceDate),
    receiptDate: toDateInputValue(invoice.receiptDate) || todayLocalDate(),
    discountAmount: String(invoice.discountAmount ?? 0),
    taxAmount: String(invoice.taxAmount ?? 0),
    notes: invoice.notes ?? '',
  }
}

function mapInvoiceLineToForm(line: PurchaseInvoiceLineResponse): PurchaseInvoiceLineFormState {
  return {
    id: line.id,
    materialId: String(line.materialId),
    quantity: String(line.quantity),
    uomId: String(line.uomId),
    unitCost: String(line.unitCost),
    expiryDate: line.expiryDate ?? '',
    lineTotal: line.lineTotal,
  }
}

function formatDisplayAmount(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return `${formatMoney(value)} ج.م`
}

function scrollToFirstError() {
  requestAnimationFrame(() => {
    document
      .querySelector('.pi-form-field--error')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
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

function usePurchaseInvoiceFormMode(): FormMode {
  const { id } = useParams<{ id: string }>()
  const { pathname } = useLocation()
  if (!id) return 'create'
  if (pathname.endsWith('/edit')) return 'edit'
  return 'view'
}

function PurchaseInvoiceForm({ mode }: { mode: FormMode }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const { id } = useParams<{ id: string }>()
  const canView = canViewPurchaseInvoices()
  const canManage = canManagePurchaseInvoices()
  const canUnpost = canUnpostPurchaseInvoices()
  const canUncomplete = canUncompletePurchaseInvoices()

  const [invoice, setInvoice] = useState<PurchaseInvoiceResponse | null>(null)
  const [header, setHeader] = useState<HeaderFormState>(emptyHeader)
  const { uoms: cachedUoms } = useUomLookup()
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const uoms = cachedUoms as unknown as UomResponse[]
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [loading, setLoading] = useState(mode !== 'create')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [postCheckLoading, setPostCheckLoading] = useState(false)
  const postInFlightRef = useRef(false)

  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)
  const [unpostModalOpen, setUnpostModalOpen] = useState(false)
  const [uncompleteModalOpen, setUncompleteModalOpen] = useState(false)
  const [cancelInvoiceModalOpen, setCancelInvoiceModalOpen] = useState(false)
  const [backdatedWarningOpen, setBackdatedWarningOpen] = useState(false)
  const [backdatedConflicts, setBackdatedConflicts] = useState<BackdatedConsumptionCheckResponse[]>([])
  const [discardModalOpen, setDiscardModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const isCreate = mode === 'create'
  const isView = mode === 'view'
  const persistedId = invoice != null ? String(invoice.id) : id
  const displayStatus: PurchaseInvoiceStatus = invoice?.status ?? 'DRAFT'
  const isDraft = displayStatus === 'DRAFT'
  const headerFieldsEnabled = !persistedId || isEditingHeader
  const headerInputsDisabled = !headerFieldsEnabled || headerSaving || lookupsLoading || actionLoading
  const showDraftLineActions = isDraft && canManage
  const startEditLineRef = useRef<(line: PurchaseInvoiceLineFormState) => void>(() => undefined)
  const deleteLineRef = useRef<(lineId: number) => void>(() => undefined)
  const handleSchemaEditLine = useCallback(
    (line: PurchaseInvoiceLineFormState) => startEditLineRef.current(line),
    [],
  )
  const handleSchemaDeleteLine = useCallback(
    (line: PurchaseInvoiceLineFormState) => deleteLineRef.current(line.id!),
    [],
  )

  const isHeaderDirty = useMemo(() => {
    if (!invoice) return false
    const initial = mapInvoiceToHeader(invoice)
    return (
      header.supplierId !== initial.supplierId ||
      header.warehouseId !== initial.warehouseId ||
      header.invoiceDate !== initial.invoiceDate ||
      header.notes !== initial.notes
    )
  }, [invoice, header])

  const schema = useMemo(
    () =>
      // Schema actions run only from user events; refs dispatch to the current controller.
      // eslint-disable-next-line react-hooks/refs
      createPurchaseInvoiceLineSchema({
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
    () => (invoice?.lines ?? []).map(mapInvoiceLineToForm),
    [invoice?.lines],
  )

  const lineController = useDocumentLines<
    PurchaseInvoiceLineFormState,
    { materials: MaterialResponse[]; uoms: UomResponse[] }
  >({
    schema,
    initialLines: initialLineForms,
    linesReady: !loading,
    lookups: { materials, uoms },
    locale,
    t,
    onAddLine: async (payload) => {
      if (!persistedId) throw new Error('Purchase invoice must be persisted before adding a line')
      const updated = await purchaseInvoiceService.addPurchaseInvoiceLine(
        persistedId,
        payload as PurchaseInvoiceLineRequest,
      )
      setInvoice(updated)
      return updated.lines.map(mapInvoiceLineToForm)
    },
    onUpdateLine: async (lineId, payload) => {
      if (!persistedId) throw new Error('Purchase invoice must be persisted before updating a line')
      const updated = await purchaseInvoiceService.updatePurchaseInvoiceLine(
        persistedId,
        lineId,
        payload as UpdatePurchaseInvoiceLineRequest,
      )
      setInvoice(updated)
      return updated.lines.map(mapInvoiceLineToForm)
    },
    onDeleteLine: async (lineId) => {
      if (!persistedId) throw new Error('Purchase invoice must be persisted before deleting a line')
      const updated = await purchaseInvoiceService.deletePurchaseInvoiceLine(persistedId, lineId)
      setInvoice(updated)
      return updated.lines.map(mapInvoiceLineToForm)
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
    (result: LineOpResult<PurchaseInvoiceLineFormState>, successKey: string) => {
      if (result.ok) {
        notify.success(t(successKey))
        return
      }
      switch (result.kind) {
        case 'validation':
        case 'api':
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
      if (!persistedId || !isDraft || isEditingHeader) return
      void deleteLine(lineId).then((result) => {
        handleLineResult(result, 'inventory.purchase.toast.lineDeleteSuccess')
      })
    }
  }, [startEditLine, persistedId, isDraft, isEditingHeader, deleteLine, handleLineResult])

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
      setPendingNavigation('/purchase/purchase-invoices')
      setDiscardModalOpen(true)
    } else {
      navigate('/purchase/purchase-invoices')
    }
  }

  function handleConfirmDiscard() {
    if (invoice) {
      setHeader(mapInvoiceToHeader(invoice))
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
      const [warehouseData, supplierData, materialData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getSuppliers({ active: true }),
        inventoryService.getMaterials({ active: true }),
      ])
      setWarehouses(warehouseData)
      setSuppliers(supplierData)
      setMaterials(materialData)
    } catch {
      setWarehouses([])
      setSuppliers([])
      setMaterials([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const loadInvoice = useCallback(async (targetId: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await purchaseInvoiceService.getPurchaseInvoice(targetId)
      setInvoice(data)
      setHeader(mapInvoiceToHeader(data))
      setIsEditingHeader(false)
    } catch (err) {
      setInvoice(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadLookups(), 0)
    return () => window.clearTimeout(timer)
  }, [canView, loadLookups])

  useEffect(() => {
    if (!canView || isCreate || !id) return
    const timer = window.setTimeout(() => void loadInvoice(id), 0)
    return () => window.clearTimeout(timer)
  }, [canView, isCreate, id, loadInvoice])

  const viewTotals = invoice
    ? {
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        total: invoice.totalAmount,
      }
    : null

  function validateHeader(): FieldErrors {
    const errors: FieldErrors = {}
    const fieldRequired = t('inventory.purchase.validation.fieldRequired')
    if (!header.warehouseId) errors.warehouseId = fieldRequired
    if (!header.invoiceDate) errors.invoiceDate = fieldRequired
    if (!header.receiptDate) errors.receiptDate = fieldRequired
    return errors
  }

  function buildHeaderPayload(): UpdatePurchaseInvoiceHeaderRequest {
    return {
      supplierId: header.supplierId ? Number(header.supplierId) : null,
      warehouseId: Number(header.warehouseId),
      invoiceDate: header.invoiceDate,
      receiptDate: header.receiptDate,
      discountAmount: Number(header.discountAmount) || 0,
      taxAmount: Number(header.taxAmount) || 0,
      notes: header.notes.trim() || null,
    }
  }

  async function handleSaveHeader() {
    const validationErrors = validateHeader()
    if (validationErrors.warehouseId || validationErrors.invoiceDate || validationErrors.receiptDate) {
      setFieldErrors(validationErrors)
      scrollToFirstError()
      return
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      const payload = buildHeaderPayload()
      if (!persistedId) {
        const created = await purchaseInvoiceService.createPurchaseInvoice(payload)
        setInvoice(created)
        setHeader(mapInvoiceToHeader(created))
        notify.success(t('inventory.purchase.toast.createSuccess'))
        navigate(`/purchase/purchase-invoices/${created.id}`, { replace: true })
        return
      }
      const updated = await purchaseInvoiceService.updatePurchaseInvoiceHeader(persistedId, payload)
      setInvoice(updated)
      setHeader(mapInvoiceToHeader(updated))
      setIsEditingHeader(false)
      notify.success(t('inventory.purchase.toast.updateSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setHeaderSaving(false)
    }
  }

  async function ensureInvoicePersisted(): Promise<boolean> {
    if (persistedId) return true
    const validationErrors = validateHeader()
    if (validationErrors.warehouseId || validationErrors.invoiceDate || validationErrors.receiptDate) {
      setFieldErrors(validationErrors)
      scrollToFirstError()
      return false
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      const created = await purchaseInvoiceService.createPurchaseInvoice(buildHeaderPayload())
      setInvoice(created)
      setHeader(mapInvoiceToHeader(created))
      notify.success(t('inventory.purchase.toast.createSuccess'))
      return true
    } catch {
      return false
    } finally {
      setHeaderSaving(false)
    }
  }

  async function handleAddItemClick() {
    if (!(await ensureInvoicePersisted())) return
    startAddLine(newLine())
  }

  async function handleSaveNewLine() {
    const result = await saveNewLine((form) => ({
      materialId: Number(form.materialId),
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      unitCost: Number(form.unitCost),
      expiryDate: form.expiryDate || null,
    }))
    handleLineResult(result, 'inventory.purchase.toast.lineAddSuccess')
  }

  async function handleSaveEditLine(lineId: number) {
    const result = await saveEditLine(lineId, (form) => ({
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      unitCost: Number(form.unitCost),
      expiryDate: form.expiryDate || null,
    }))
    handleLineResult(result, 'inventory.purchase.toast.lineUpdateSuccess')
  }

  async function handleCompleteInvoice() {
    if (!persistedId || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      const updated = await purchaseInvoiceService.completePurchaseInvoice(persistedId)
      setInvoice(updated)
      setHeader(mapInvoiceToHeader(updated))
      setIsEditingHeader(false)
      notify.success(t('inventory.purchase.toast.completeSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function postInvoiceToStock() {
    if (!persistedId || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      const updated = await purchaseInvoiceService.postPurchaseInvoice(persistedId)
      setInvoice(updated)
      notify.success(t('inventory.purchase.toast.postSuccess'))
      notifyStockBalancesRefresh()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePostInvoice() {
    if (!persistedId || displayStatus !== 'COMPLETE' || actionLoading || postCheckLoading || postInFlightRef.current) return
    postInFlightRef.current = true
    setPostCheckLoading(true)
    let shouldPost = false
    try {
      const conflicts = await purchaseInvoiceService.getBackdatedConsumptionCheck(persistedId)
      if (conflicts.length > 0) {
        setBackdatedConflicts(conflicts)
        setBackdatedWarningOpen(true)
        return
      }
      shouldPost = true
    } catch (error) {
      console.error('[purchase-invoices] Backdated consumption check failed; posting anyway.', error)
      shouldPost = true
    } finally {
      setPostCheckLoading(false)
      if (!shouldPost) postInFlightRef.current = false
    }

    try {
      await postInvoiceToStock()
    } finally {
      postInFlightRef.current = false
    }
  }

  async function handlePostAnyway() {
    if (!persistedId || displayStatus !== 'COMPLETE' || actionLoading || postInFlightRef.current) return
    postInFlightRef.current = true
    setBackdatedWarningOpen(false)
    try {
      await postInvoiceToStock()
    } finally {
      postInFlightRef.current = false
    }
  }

  async function handleUncompleteInvoice(reason?: string) {
    if (!persistedId || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.uncompletePurchaseInvoice(persistedId, reason)
      await loadInvoice(persistedId)
      notify.success(t('inventory.purchase.toast.uncompleteSuccess'))
      setUncompleteModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteInvoice() {
    if (!persistedId || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.deletePurchaseInvoice(persistedId)
      notify.success(t('inventory.purchase.toast.deleteSuccess'))
      navigate('/purchase/purchase-invoices')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnpostInvoice(reason?: string) {
    if (!persistedId || displayStatus !== 'POSTED') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.unpostPurchaseInvoice(persistedId, reason)
      await loadInvoice(persistedId)
      notify.success(t('inventory.purchase.toast.unpostSuccess'))
      notifyStockBalancesRefresh()
      setUnpostModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelInvoice(reason?: string) {
    if (!persistedId || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.cancelPurchaseInvoice(persistedId, reason)
      await loadInvoice(persistedId)
      notify.success(t('inventory.purchase.toast.cancelSuccess'))
      setCancelInvoiceModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  if (!canView) return <PurchaseInvoiceAccessDenied />

  const pageTitle = isCreate
    ? t('inventory.purchase.form.createTitle')
    : mode === 'edit'
      ? t('inventory.purchase.form.editTitle')
      : t('inventory.purchase.form.viewTitle')

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: getInventoryLocalizedName(s, locale),
  }))

  const warehouseOptions = warehouses.map((w) => ({
    value: String(w.id),
    label: getInventoryLocalizedName(w, locale),
  }))

  const showFormActions =
    isCreate ||
    (invoice &&
      displayStatus !== 'CANCELLED' &&
      (canManage ||
        (canUnpost && displayStatus === 'POSTED') ||
        (canUncomplete && displayStatus === 'COMPLETE')))

  return (
    <ListPage className="purchase-invoice-form-page purchase-invoice-form-page--redesign">
      {loading ? (
        <div className="pi-form-header-card">
          <div className="pi-form-header-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="pi-form-field">
                <div className="pi-form-field__skeleton" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      {!loading ? (
        <>
          {isView && invoice?.status === 'POSTED' ? (
            <div className="alert-success purchase-invoice-posted-banner">
              {t('inventory.purchase.postedBanner')}
              {invoice.postedAt ? (
                <span className="purchase-invoice-posted-banner__date" dir="ltr">
                  {' '}
                  · {formatDate(invoice.postedAt)}
                </span>
              ) : null}
            </div>
          ) : null}

          <form
            id="pi-invoice-form"
            className="pi-form"
            onSubmit={(event: FormEvent) => event.preventDefault()}
            noValidate
          >
            <DetailHeader
              title={pageTitle}
              statusBadge={<PurchaseInvoiceFormStatusPill status={displayStatus} />}
              onBack={handleBackToListClick}
              backDisabled={headerSaving || lineSaving || actionLoading}
              actions={
                !loading && showFormActions ? (
                  <>
                      {canManage && persistedId && displayStatus === 'DRAFT' ? (
                        <Button
                          variant="primary"
                          disabled={headerSaving || actionLoading || lineSaving || isEditingHeader || addingLine || editingLineId != null}
                          onClick={() => void handleCompleteInvoice()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <CheckCircle size={18} aria-hidden="true" />
                              {t('inventory.purchase.actions.complete')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canManage && persistedId && displayStatus === 'COMPLETE' ? (
                        <Button
                          variant="post"
                          disabled={headerSaving || actionLoading || postCheckLoading || lineSaving}
                          onClick={() => void handlePostInvoice()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Send size={18} aria-hidden="true" />
                              {t('inventory.purchase.actions.post')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canUncomplete && persistedId && displayStatus === 'COMPLETE' ? (
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
                              {t('inventory.purchase.actions.uncomplete')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canUnpost && persistedId && displayStatus === 'POSTED' ? (
                        <Button
                          variant="unpost"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setUnpostModalOpen(true)}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Undo2 size={18} aria-hidden="true" />
                              {t('inventory.purchase.actions.unpost')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canManage && persistedId && displayStatus === 'DRAFT' ? (
                        <Button
                          variant="cancelDoc"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setCancelInvoiceModalOpen(true)}
                        >
                          <span className="pi-form-actions__icon-text">
                            <XCircle size={18} aria-hidden="true" />
                            {t('inventory.purchase.actions.cancel')}
                          </span>
                        </Button>
                      ) : null}
                      {canManage && persistedId && displayStatus === 'DRAFT' ? (
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--delete-danger"
                          label={t('inventory.purchase.actions.delete')}
                          onClick={() => void handleDeleteInvoice()}
                          disabled={headerSaving || actionLoading || lineSaving}
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </IconActionButton>
                      ) : null}

                      {displayStatus === 'DRAFT' && canManage && persistedId ? (
                        isEditingHeader ? (
                          <>
                            <IconActionButton
                              className="action-btn action-btn--icon action-btn--confirm"
                              label={t('inventory.purchase.form.saveHeader')}
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
                            label={t('inventory.purchase.actions.editHeader')}
                            onClick={handleEditButtonClick}
                            disabled={headerSaving || lineSaving || actionLoading || addingLine || editingLineId != null}
                          >
                            <Pencil size={20} aria-hidden />
                          </IconActionButton>
                        )
                      ) : null}

                      {!persistedId ? (
                        <Button
                          variant="primary"
                          disabled={headerSaving || lookupsLoading}
                          onClick={() => void handleSaveHeader()}
                        >
                          {headerSaving ? (
                            <>
                              <Loader2 size={16} className="pi-form-actions__submit-spinner" aria-hidden />
                              {t('inventory.purchase.form.saving')}
                            </>
                          ) : (
                            t('inventory.purchase.form.saveHeader')
                          )}
                        </Button>
                      ) : null}
                  </>
                ) : null
              }
            >
              <div className="pi-form-header-grid">
                {headerInputsDisabled ? (
                  <>
                    <DetailField
                      label={t('common.invoiceNo')}
                      value={header.invoiceNumber || invoice?.invoiceNumber || '—'}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.supplier')}
                      value={
                        supplierOptions.find((opt) => opt.value === header.supplierId)?.label ??
                        invoice?.supplierName ??
                        '—'
                      }
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.warehouse')}
                      value={
                        warehouseOptions.find((opt) => opt.value === header.warehouseId)?.label ??
                        invoice?.warehouseName ??
                        '—'
                      }
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.invoiceDate')}
                      value={header.invoiceDate}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.receiptDate')}
                      value={header.receiptDate}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.discountAmount')}
                      value={`${header.discountAmount || '0.00'} ج.م`}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.taxAmount')}
                      value={`${header.taxAmount || '0.00'} ج.م`}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchase.fields.notes')}
                      value={header.notes?.trim() || '—'}
                      fullWidth
                    />
                  </>
                ) : (
                  <>
                    <DetailField
                      label={t('common.invoiceNo')}
                      value={header.invoiceNumber || invoice?.invoiceNumber || '—'}
                      dir="ltr"
                    />
                    <PiFormField label={t('inventory.purchase.fields.supplier')}>
                      {lookupsLoading ? (
                        <div className="pi-form-field__skeleton" />
                      ) : (
                        <Dropdown
                          value={header.supplierId}
                          onChange={(val) => setHeader((prev) => ({ ...prev, supplierId: val }))}
                          options={[
                            { value: '', label: t('inventory.purchase.fields.supplierOptional') },
                            ...supplierOptions,
                          ]}
                          ariaLabel={t('inventory.purchase.fields.supplier')}
                          searchable
                          searchPlaceholder={t('common.search')}
                          className="dropdown--form-header"
                        />
                      )}
                    </PiFormField>

                    <PiFormField
                      label={t('inventory.purchase.fields.warehouse')}
                      required
                      error={fieldErrors.warehouseId}
                    >
                      {lookupsLoading ? (
                        <div className="pi-form-field__skeleton" />
                      ) : (
                        <Dropdown
                          value={header.warehouseId}
                          onChange={(val) => setHeader((prev) => ({ ...prev, warehouseId: val }))}
                          options={[
                            { value: '', label: t('inventory.common.selectWarehouse') },
                            ...warehouseOptions,
                          ]}
                          ariaLabel={t('inventory.purchase.fields.warehouse')}
                          searchable
                          searchPlaceholder={t('common.search')}
                          className="dropdown--form-header"
                        />
                      )}
                    </PiFormField>

                    <PiFormField
                      label={t('inventory.purchase.fields.invoiceDate')}
                      htmlFor="pi-invoice-date"
                      required
                      error={fieldErrors.invoiceDate}
                    >
                      <DatePicker
                        value={header.invoiceDate}
                        onChange={(val) => setHeader((prev) => ({ ...prev, invoiceDate: val }))}
                        placeholder={t('inventory.purchase.fields.invoiceDate')}
                        ariaLabel={t('inventory.purchase.fields.invoiceDate')}
                        size="md"
                        className="date-picker--form-field"
                      />
                    </PiFormField>

                    <PiFormField
                      label={t('inventory.purchase.fields.receiptDate')}
                      htmlFor="pi-receipt-date"
                      required
                      error={fieldErrors.receiptDate}
                    >
                      <DatePicker
                        value={header.receiptDate}
                        onChange={(val) => setHeader((prev) => ({ ...prev, receiptDate: val }))}
                        placeholder={t('inventory.purchase.fields.receiptDate')}
                        ariaLabel={t('inventory.purchase.fields.receiptDate')}
                        size="md"
                        className="date-picker--form-field"
                      />
                    </PiFormField>

                    <PiFormField label={t('inventory.purchase.fields.discountAmount')} htmlFor="pi-discount">
                      <div className="pi-form-field__input-wrap">
                        <input
                          id="pi-discount"
                          type="number"
                          min={0}
                          step="any"
                          className="pi-form-field__input pi-form-field__input--ltr"
                          value={header.discountAmount}
                          onChange={(e) => setHeader((prev) => ({ ...prev, discountAmount: e.target.value }))}
                          placeholder="0.00"
                        />
                        <span className="pi-form-field__suffix">ج.م</span>
                      </div>
                    </PiFormField>

                    <PiFormField label={t('inventory.purchase.fields.taxAmount')} htmlFor="pi-tax">
                      <div className="pi-form-field__input-wrap">
                        <input
                          id="pi-tax"
                          type="number"
                          min={0}
                          step="any"
                          className="pi-form-field__input pi-form-field__input--ltr"
                          value={header.taxAmount}
                          onChange={(e) => setHeader((prev) => ({ ...prev, taxAmount: e.target.value }))}
                          placeholder="0.00"
                        />
                        <span className="pi-form-field__suffix">ج.م</span>
                      </div>
                    </PiFormField>

                    <PiFormField label={t('inventory.purchase.fields.notes')} htmlFor="pi-notes">
                      <textarea
                        id="pi-notes"
                        className="pi-form-field__textarea"
                        value={header.notes}
                        onChange={(e) => setHeader((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </PiFormField>
                  </>
                )}
              </div>

                {viewTotals ? (
                  <div className="pi-form-header-totals">
                    <div className="pi-form-header-totals__row">
                      <span className="pi-form-header-totals__label">
                        {t('inventory.purchase.totals.subtotalFull')}
                      </span>
                      <span className="pi-form-header-totals__value" dir="ltr">
                        {formatDisplayAmount(viewTotals.subtotal)}
                      </span>
                    </div>
                    {viewTotals.discountAmount > 0 ? (
                      <div className="pi-form-header-totals__row">
                        <span className="pi-form-header-totals__label">
                          {t('inventory.purchase.totals.invoiceDiscount')}
                        </span>
                        <span className="pi-form-header-totals__value" dir="ltr">
                          {formatDisplayAmount(viewTotals.discountAmount)}
                        </span>
                      </div>
                    ) : null}
                    {viewTotals.taxAmount > 0 ? (
                      <div className="pi-form-header-totals__row">
                        <span className="pi-form-header-totals__label">
                          {t('inventory.purchase.totals.invoiceTax')}
                        </span>
                        <span className="pi-form-header-totals__value" dir="ltr">
                          {formatDisplayAmount(viewTotals.taxAmount)}
                        </span>
                      </div>
                    ) : null}
                    <div className="pi-form-header-totals__divider" />
                    <div className="pi-form-header-totals__row pi-form-header-totals__row--grand">
                      <span className="pi-form-header-totals__label">
                        {t('inventory.purchase.totals.total')}
                      </span>
                      <span
                        className="pi-form-header-totals__value pi-form-header-totals__value--grand"
                        dir="ltr"
                      >
                        {formatDisplayAmount(viewTotals.total)}
                      </span>
                    </div>
                  </div>
                ) : null}
            </DetailHeader>

            <SchemaDocumentLinesCard
              title={t('inventory.purchase.lines.title')}
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
              interactionLocked={isEditingHeader}
              emptyState={
                <div className="pi-form-lines__empty">
                  <Receipt className="pi-form-lines__empty-icon" size={40} strokeWidth={1.25} aria-hidden="true" />
                  <p className="pi-form-lines__empty-title">{t('inventory.purchase.lines.emptyTitle')}</p>
                  <p className="pi-form-lines__empty-hint">{t('inventory.purchase.lines.emptyHint')}</p>
                </div>
              }
              onFieldChange={updateFormValue}
              onSaveLine={(lineId) => {
                if (lineId != null) {
                  void handleSaveEditLine(Number(lineId))
                } else {
                  void handleSaveNewLine()
                }
              }}
              onCancelLine={cancelLineAction}
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
        title={t('inventory.purchase.confirm.uncompleteTitle')}
        message={t('inventory.purchase.confirm.uncompleteMessage')}
        confirmLabel={t('inventory.purchase.confirm.uncompleteConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setUncompleteModalOpen(false)}
        onConfirm={(reason) => void handleUncompleteInvoice(reason)}
      />

      <PurchaseDocumentReasonModal
        open={unpostModalOpen}
        title={t('inventory.purchase.confirm.unpostTitle')}
        message={t('inventory.purchase.confirm.unpostMessage')}
        confirmLabel={t('inventory.purchase.confirm.unpostConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setUnpostModalOpen(false)}
        onConfirm={(reason) => void handleUnpostInvoice(reason)}
      />

      <PurchaseDocumentReasonModal
        open={cancelInvoiceModalOpen}
        title={t('inventory.purchase.confirm.cancelInvoiceTitle')}
        message={t('inventory.purchase.confirm.cancelInvoiceMessage')}
        confirmLabel={t('inventory.purchase.confirm.cancelInvoiceConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="dangerConfirm"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setCancelInvoiceModalOpen(false)}
        onConfirm={(reason) => void handleCancelInvoice(reason)}
      />

      <Modal
        open={backdatedWarningOpen}
        title={t('inventory.purchase.backdatedWarning.title')}
        onClose={() => setBackdatedWarningOpen(false)}
        size="medium"
        className="pi-backdated-warning"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBackdatedWarningOpen(false)} disabled={actionLoading}>
              {t('inventory.purchase.backdatedWarning.backToEdit')}
            </Button>
            <Button variant="warning" onClick={() => void handlePostAnyway()} disabled={actionLoading}>
              {actionLoading ? t('common.loading') : t('inventory.purchase.backdatedWarning.postAnyway')}
            </Button>
          </>
        }
      >
        <div className="pi-backdated-warning__body">
          <div className="pi-backdated-warning__alert" role="alert">
            <AlertTriangle size={20} aria-hidden="true" />
            <p>
              {t('inventory.purchase.backdatedWarning.intro', {
                date: formatDate(header.receiptDate || invoice?.receiptDate, locale),
              })}
            </p>
          </div>
          <ul className="pi-backdated-warning__list">
            {backdatedConflicts.map((conflict) => (
              <li key={conflict.materialId} className="pi-backdated-warning__item">
                <span className="pi-backdated-warning__material">
                  {getInventoryLocalizedName(
                    {
                      name: conflict.materialName ?? '',
                      nameAr: conflict.materialNameAr ?? undefined,
                    },
                    locale,
                  )}
                </span>
                <span className="pi-backdated-warning__date">
                  {t('inventory.purchase.backdatedWarning.lastConsumed', {
                    date: formatDate(conflict.lastConsumptionDate, locale),
                  })}
                </span>
              </li>
            ))}
          </ul>
          <p className="pi-backdated-warning__note">
            {t('inventory.purchase.backdatedWarning.futureMessage')}
          </p>
        </div>
      </Modal>

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
    </ListPage>
  )
}

export function PurchaseInvoiceCreatePage() {
  return <PurchaseInvoiceForm mode="create" />
}

export function PurchaseInvoiceEditPage() {
  return <PurchaseInvoiceForm mode="edit" />
}

export function PurchaseInvoiceViewPage() {
  return <PurchaseInvoiceForm mode="view" />
}

export function PurchaseInvoiceFormPage() {
  const mode = usePurchaseInvoiceFormMode()
  return <PurchaseInvoiceForm mode={mode} />
}
