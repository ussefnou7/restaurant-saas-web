import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { PurchaseDocumentCancelModal } from '../../../components/inventory/PurchaseDocumentCancelModal'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { ListPage } from '../../../components/ui/ListPage'
import { IconActionButton } from '../../../components/ui/RowActions'
import { useNotify } from '../../../components/ui/NotificationContext'
import { DetailField } from '../../../components/fields'
import { DocumentHeader } from '../../../components/layout/DocumentLayout'
import { SchemaDocumentLinesCard } from '../../../components/layout/DocumentLayout/SchemaDocumentLinesCard'
import {
  createPurchaseReturnLineSchema,
  type PurchaseReturnLineFormState,
} from '../../../schemas/purchaseReturnLineSchema'
import { useDocumentLines, type LineOpResult } from '../../../hooks/useDocumentLines'
import { useUomLookup } from '../../../hooks/useUomLookup'
import { PurchaseInvoiceFormStatusPill } from '../purchase-invoices/PurchaseInvoiceFormStatusPill'
import { useTranslation } from '../../../i18n/useTranslation'
import * as purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import * as purchaseReturnService from '../../../services/purchaseReturnService'
import type { PurchaseInvoiceResponse } from '../../../types/purchaseInvoice'
import type { UomResponse } from '../../../types/inventory'
import type {
  PurchaseReturnLineResponse,
  PurchaseReturnLineRequest,
  PurchaseReturnReason,
  PurchaseReturnResponse,
  PurchaseReturnUpdateLineRequest,
  ReturnableLineResponse,
} from '../../../types/purchaseReturn'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney, todayLocalDate } from '../../../utils/format'
import {
  canManagePurchaseInvoices,
  canUncompletePurchaseReturns,
  canUnpostPurchaseReturns,
  canViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { getPurchaseReturnReasonLabel } from '../../../utils/purchaseInvoiceDisplay'
import { PurchaseInvoiceAccessDenied } from '../purchase-invoices/PurchaseInvoiceAccessDenied'

const RETURN_REASONS: PurchaseReturnReason[] = [
  'DAMAGED',
  'WRONG_QUANTITY',
  'WRONG_SPEC',
  'EXPIRED',
  'OTHER',
]

type FormMode = 'create' | 'view'

type HeaderFormState = {
  originalInvoiceId: string
  returnDate: string
  reason: PurchaseReturnReason | ''
  notes: string
}

type FieldErrors = {
  originalInvoiceId?: string
  returnDate?: string
  reason?: string
}

function emptyHeader(): HeaderFormState {
  return {
    originalInvoiceId: '',
    returnDate: todayLocalDate(),
    reason: '',
    notes: '',
  }
}

function emptyLineForm(): PurchaseReturnLineFormState {
  return {
    originalLineId: '',
    quantity: '',
    uomId: '',
    unitCost: '',
    notes: '',
  }
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function mapReturnToHeader(purchaseReturn: PurchaseReturnResponse): HeaderFormState {
  return {
    originalInvoiceId: String(purchaseReturn.originalInvoiceId),
    returnDate: toDateInputValue(purchaseReturn.returnDate),
    reason: purchaseReturn.reason,
    notes: purchaseReturn.notes ?? '',
  }
}

function mapReturnLineToForm(
  line: PurchaseReturnLineResponse,
  uomSymbolFn?: (id: number | string) => string,
): PurchaseReturnLineFormState {
  const cachedSymbol = uomSymbolFn?.(line.uomId)
  return {
    id: line.id,
    originalLineId: String(line.originalLineId),
    quantity: String(line.quantity),
    uomId: String(line.uomId),
    unitCost: String(line.unitCost),
    lineTotal: line.lineTotal,
    notes: line.notes ?? '',
    materialName: line.materialName,
    materialNameAr: line.materialNameAr,
    materialCode: line.materialCode,
    uomSymbol: cachedSymbol && cachedSymbol !== '—' ? cachedSymbol : line.uomSymbol ?? line.uomCode ?? undefined,
  }
}

function formatDisplayAmount(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return `${formatMoney(value)} ج.م`
}

function formatInvoiceOption(invoice: PurchaseInvoiceResponse): string {
  const supplier = invoice.supplierName ?? invoice.supplierNameAr ?? ''
  const number = invoice.invoiceNumber ?? `#${invoice.id}`
  const date = formatDate(invoice.invoiceDate)
  return `${number} · ${supplier} · ${date}`
}


function scrollToFirstError() {
  requestAnimationFrame(() => {
    document
      .querySelector('.pi-form-field--error')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

interface PrFormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  children: ReactNode
}

function PrFormField({ label, htmlFor, required, error, children }: PrFormFieldProps) {
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

function PurchaseReturnForm({ mode }: { mode: FormMode }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const { id } = useParams<{ id: string }>()
  const canView = canViewPurchaseInvoices()
  const canManage = canManagePurchaseInvoices()
  const canUnpost = canUnpostPurchaseReturns()
  const canUncomplete = canUncompletePurchaseReturns()

  const { uoms: cachedUoms, uomSymbol } = useUomLookup()
  const [purchaseReturn, setPurchaseReturn] = useState<PurchaseReturnResponse | null>(null)
  const [header, setHeader] = useState<HeaderFormState>(emptyHeader)
  const [postedInvoices, setPostedInvoices] = useState<PurchaseInvoiceResponse[]>([])
  const uoms = cachedUoms as unknown as UomResponse[]
  const [returnableLines, setReturnableLines] = useState<ReturnableLineResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [returnableLoading, setReturnableLoading] = useState(false)
  const [returnableLoadedForId, setReturnableLoadedForId] = useState<string | null>(null)
  const [loading, setLoading] = useState(mode !== 'create')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [unpostModalOpen, setUnpostModalOpen] = useState(false)
  const [uncompleteModalOpen, setUncompleteModalOpen] = useState(false)
  const [discardModalOpen, setDiscardModalOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)

  const isCreate = mode === 'create'
  const persistedId = purchaseReturn != null ? String(purchaseReturn.id) : id
  const displayStatus = purchaseReturn?.status ?? 'DRAFT'
  const isDraft = displayStatus === 'DRAFT'
  const headerFieldsEnabled = !persistedId || isEditingHeader
  const headerInputsDisabled =
    !headerFieldsEnabled || headerSaving || lookupsLoading || actionLoading
  const showDraftLineActions = isDraft && canManage
  const originalInvoiceLocked = persistedId != null
  const startEditLineRef = useRef<(line: PurchaseReturnLineFormState) => void>(() => undefined)
  const deleteLineRef = useRef<(lineId: number) => void>(() => undefined)
  const handleSchemaEditLine = useCallback(
    (line: PurchaseReturnLineFormState) => startEditLineRef.current(line),
    [],
  )
  const handleSchemaDeleteLine = useCallback(
    (line: PurchaseReturnLineFormState) => deleteLineRef.current(line.id!),
    [],
  )

  const isHeaderDirty = useMemo(() => {
    if (!purchaseReturn) return false
    const initial = mapReturnToHeader(purchaseReturn)
    return (
      header.originalInvoiceId !== initial.originalInvoiceId ||
      header.returnDate !== initial.returnDate ||
      header.reason !== initial.reason ||
      header.notes !== initial.notes
    )
  }, [purchaseReturn, header])

  const schema = useMemo(
    () =>
      // Schema actions run only from user events; refs dispatch to the current controller.
      // eslint-disable-next-line react-hooks/refs
      createPurchaseReturnLineSchema({
        lookups: { returnableLines, uoms },
        locale,
        t,
        handlers: {
          onEditLine: handleSchemaEditLine,
          onDeleteLine: handleSchemaDeleteLine,
        },
      }),
    [returnableLines, uoms, locale, t, handleSchemaEditLine, handleSchemaDeleteLine],
  )

  const initialLineForms = useMemo(
    () => (purchaseReturn?.lines ?? []).map((l) => mapReturnLineToForm(l, uomSymbol)),
    [purchaseReturn?.lines, uomSymbol],
  )

  const lineController = useDocumentLines<
    PurchaseReturnLineFormState,
    { returnableLines: ReturnableLineResponse[]; uoms: UomResponse[] }
  >({
    schema,
    initialLines: initialLineForms,
    linesReady: !loading,
    lookups: { returnableLines, uoms },
    locale,
    t,
    onAddLine: async (payload) => {
      if (!persistedId) throw new Error('Purchase return must be persisted before adding a line')
      const updated = await purchaseReturnService.addPurchaseReturnLine(
        persistedId,
        payload as PurchaseReturnLineRequest,
      )
      setPurchaseReturn(updated)
      return updated.lines.map((l) => mapReturnLineToForm(l, uomSymbol))
    },
    onUpdateLine: async (lineId, payload) => {
      if (!persistedId) throw new Error('Purchase return must be persisted before updating a line')
      const updated = await purchaseReturnService.updatePurchaseReturnLine(
        persistedId,
        lineId,
        payload as PurchaseReturnUpdateLineRequest,
      )
      setPurchaseReturn(updated)
      return updated.lines.map((l) => mapReturnLineToForm(l, uomSymbol))
    },
    onDeleteLine: async (lineId) => {
      if (!persistedId) throw new Error('Purchase return must be persisted before deleting a line')
      const updated = await purchaseReturnService.deletePurchaseReturnLine(persistedId, lineId)
      setPurchaseReturn(updated)
      return updated.lines.map((l) => mapReturnLineToForm(l, uomSymbol))
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

  const availableReturnableLines = useMemo(
    () =>
      returnableLines.filter(
        (candidate) =>
          !lines.some(
            (existing) =>
              String(existing.originalLineId) === String(candidate.originalLineId),
          ),
      ),
    [returnableLines, lines],
  )
  const addUnavailable =
    persistedId != null &&
    (returnableLoading ||
      returnableLoadedForId !== String(persistedId) ||
      availableReturnableLines.length === 0)

  const handleLineResult = useCallback(
    (result: LineOpResult<PurchaseReturnLineFormState>, successKey: string) => {
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
        handleLineResult(result, 'inventory.purchaseReturn.toast.lineDeleteSuccess')
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
      setPendingNavigation('/purchase/purchase-returns')
      setDiscardModalOpen(true)
    } else {
      navigate('/purchase/purchase-returns')
    }
  }

  function handleConfirmDiscard() {
    if (purchaseReturn) {
      setHeader(mapReturnToHeader(purchaseReturn))
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

  const loadPostedInvoices = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const invoiceData = await purchaseInvoiceService.getPurchaseInvoices({ status: 'POSTED' })
      setPostedInvoices(invoiceData)
    } catch {
      setPostedInvoices([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const loadReturnableLines = useCallback(async (targetId?: string) => {
    const resolvedId = targetId ?? persistedId
    if (!resolvedId || !isDraft) {
      setReturnableLines([])
      setReturnableLoadedForId(null)
      return []
    }
    setReturnableLoadedForId(null)
    setReturnableLoading(true)
    try {
      const data = await purchaseReturnService.getReturnableLines(resolvedId)
      setReturnableLines(data)
      setReturnableLoadedForId(String(resolvedId))
      return data
    } catch (err) {
      setReturnableLines([])
      setReturnableLoadedForId(String(resolvedId))
      notify.error(translateApiError(err, t).message)
      return []
    } finally {
      setReturnableLoading(false)
    }
  }, [persistedId, isDraft, t, notify])

  const loadReturn = useCallback(async (targetId: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await purchaseReturnService.getPurchaseReturn(targetId)
      setPurchaseReturn(data)
      setHeader(mapReturnToHeader(data))
      setIsEditingHeader(false)
    } catch (err) {
      setPurchaseReturn(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!canView) return
    void loadPostedInvoices()
  }, [canView, loadPostedInvoices])

  useEffect(() => {
    if (!canView || isCreate || !id) return
    void loadReturn(id)
  }, [canView, isCreate, id, loadReturn])

  useEffect(() => {
    if (!canView || !persistedId || !isDraft) return
    void loadReturnableLines()
  }, [canView, persistedId, isDraft, loadReturnableLines])


  function validateHeader(): FieldErrors {
    const errors: FieldErrors = {}
    if (!header.originalInvoiceId) {
      errors.originalInvoiceId = t('inventory.purchaseReturn.validation.originalInvoiceRequired')
    }
    if (!header.returnDate) {
      errors.returnDate = t('inventory.purchaseReturn.validation.returnDateRequired')
    }
    if (!header.reason) {
      errors.reason = t('inventory.purchaseReturn.validation.reasonRequired')
    }
    return errors
  }

  async function handleSaveHeader() {
    const validationErrors = validateHeader()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      scrollToFirstError()
      return
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      const payload = {
        returnDate: header.returnDate,
        reason: header.reason as PurchaseReturnReason,
        notes: header.notes.trim() || null,
      }
      if (!persistedId) {
        const created = await purchaseReturnService.createPurchaseReturn({
          originalInvoiceId: Number(header.originalInvoiceId),
          ...payload,
        })
        notify.success(t('inventory.purchaseReturn.toast.createSuccess'))
        navigate(`/purchase/purchase-returns/${created.id}`, { replace: true })
        return
      }
      const updated = await purchaseReturnService.updatePurchaseReturnHeader(persistedId, {
        originalInvoiceId: Number(header.originalInvoiceId),
        ...payload,
      })
      setPurchaseReturn(updated)
      setHeader(mapReturnToHeader(updated))
      setIsEditingHeader(false)
      notify.success(t('inventory.purchaseReturn.toast.updateSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setHeaderSaving(false)
    }
  }

  async function ensureReturnPersisted(): Promise<PurchaseReturnResponse | null> {
    if (purchaseReturn) return purchaseReturn
    const validationErrors = validateHeader()
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      scrollToFirstError()
      return null
    }
    setFieldErrors({})
    setHeaderSaving(true)
    try {
      const created = await purchaseReturnService.createPurchaseReturn({
        originalInvoiceId: Number(header.originalInvoiceId),
        returnDate: header.returnDate,
        reason: header.reason as PurchaseReturnReason,
        notes: header.notes.trim() || null,
      })
      setPurchaseReturn(created)
      setHeader(mapReturnToHeader(created))
      notify.success(t('inventory.purchaseReturn.toast.createSuccess'))
      return created
    } catch {
      return null
    } finally {
      setHeaderSaving(false)
    }
  }

  async function handleAddItemClick() {
    const doc = await ensureReturnPersisted()
    if (!doc) return
    const docId = String(doc.id)
    const candidates =
      returnableLoadedForId === docId
        ? returnableLines
        : await loadReturnableLines(docId)
    const eligible = candidates.filter(
      (candidate) =>
        !doc.lines.some(
          (existing) => existing.originalLineId === candidate.originalLineId,
        ),
    )
    if (eligible.length === 0) return
    startAddLine(emptyLineForm())
  }

  async function handleSaveNewLine() {
    const result = await saveNewLine((form) => ({
      originalLineId: Number(form.originalLineId),
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      notes: form.notes?.trim() || null,
    }))
    handleLineResult(result, 'inventory.purchaseReturn.toast.lineAddSuccess')
  }

  async function handleSaveEditLine(lineId: number) {
    const result = await saveEditLine(lineId, (form) => ({
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      notes: form.notes?.trim() || null,
    }))
    handleLineResult(result, 'inventory.purchaseReturn.toast.lineUpdateSuccess')
  }

  async function handleCompleteReturn() {
    if (!persistedId || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      const updated = await purchaseReturnService.completePurchaseReturn(persistedId)
      setPurchaseReturn(updated)
      setHeader(mapReturnToHeader(updated))
      setIsEditingHeader(false)
      notify.success(t('inventory.purchaseReturn.toast.completeSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePostReturn() {
    if (!persistedId || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      const updated = await purchaseReturnService.postPurchaseReturn(persistedId)
      setPurchaseReturn(updated)
      notify.success(t('inventory.purchaseReturn.toast.postSuccess'))
      notifyStockBalancesRefresh()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUncompleteReturn(reason?: string) {
    if (!persistedId || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      await purchaseReturnService.uncompletePurchaseReturn(persistedId, reason)
      await loadReturn(persistedId)
      notify.success(t('inventory.purchaseReturn.toast.uncompleteSuccess'))
      setUncompleteModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnpostReturn(reason?: string) {
    if (!persistedId || displayStatus !== 'POSTED') return
    setActionLoading(true)
    try {
      await purchaseReturnService.unpostPurchaseReturn(persistedId, reason)
      await loadReturn(persistedId)
      notify.success(t('inventory.purchaseReturn.toast.unpostSuccess'))
      notifyStockBalancesRefresh()
      setUnpostModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelReturn(reason: string) {
    if (!persistedId) return
    setActionLoading(true)
    try {
      await purchaseReturnService.cancelPurchaseReturn(persistedId, reason)
      notify.success(t('inventory.purchaseReturn.toast.cancelSuccess'))
      navigate('/purchase/purchase-returns')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
      setCancelOpen(false)
    }
  }

  if (!canView) return <PurchaseInvoiceAccessDenied />

  const pageTitle = isCreate
    ? t('inventory.purchaseReturn.form.createTitle')
    : t('inventory.purchaseReturn.form.viewTitle')

  const showFormActions =
    isCreate ||
    (purchaseReturn &&
      displayStatus !== 'CANCELLED' &&
      (canManage ||
        (canUnpost && displayStatus === 'POSTED') ||
        (canUncomplete && displayStatus === 'COMPLETE')))

  return (
    <ListPage className="purchase-return-form-page purchase-invoice-form-page purchase-invoice-form-page--redesign">
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

      {!loading ? (
        <>
          {persistedId && purchaseReturn?.status === 'POSTED' ? (
            <div className="alert-success purchase-invoice-posted-banner">
              {t('inventory.purchaseReturn.postedBanner')}
              {purchaseReturn.postedAt ? (
                <span className="purchase-invoice-posted-banner__date" dir="ltr">
                  {' '}
                  · {formatDate(purchaseReturn.postedAt)}
                </span>
              ) : null}
            </div>
          ) : null}

          <form
            className="pi-form"
            onSubmit={(event: FormEvent) => event.preventDefault()}
            noValidate
          >
            <DocumentHeader
              title={pageTitle}
              statusBadge={<PurchaseInvoiceFormStatusPill status={displayStatus} />}
              actions={
                !loading && showFormActions ? (
                  <>
                      {canManage && persistedId && displayStatus === 'DRAFT' ? (
                        <Button
                          variant="primary"
                          disabled={
                            headerSaving ||
                            actionLoading ||
                            lineSaving ||
                            isEditingHeader ||
                            addingLine ||
                            editingLineId != null
                          }
                          onClick={() => void handleCompleteReturn()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <CheckCircle size={18} aria-hidden />
                              {t('inventory.purchase.actions.complete')}
                            </span>
                          )}
                        </Button>
                      ) : null}
                      {canManage && persistedId && displayStatus === 'COMPLETE' ? (
                        <Button
                          variant="post"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => void handlePostReturn()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={18} aria-hidden />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Send size={18} aria-hidden />
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
                      {canManage &&
                      persistedId &&
                      (displayStatus === 'DRAFT' || displayStatus === 'COMPLETE') ? (
                        <Button
                          variant="cancelDoc"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setCancelOpen(true)}
                        >
                          <span className="pi-form-actions__icon-text">
                            <XCircle size={18} aria-hidden />
                            {t('inventory.purchase.actions.cancel')}
                          </span>
                        </Button>
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

                      <span className="pi-form-topbar__actions-divider" aria-hidden />

                      <IconActionButton
                        className="action-btn action-btn--icon action-btn--header-back"
                        label={t('inventory.purchaseReturn.form.backToList')}
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
              reference={
                persistedId && purchaseReturn?.returnNumber ? (
                  <span className="pi-form-header-card__invoice-number" dir="ltr">
                    {purchaseReturn.returnNumber}
                  </span>
                ) : null
              }
            >
              <div className="pi-form-header-grid">
                {headerInputsDisabled ? (
                  <>
                    <DetailField
                      label={t('inventory.purchaseReturn.fields.originalInvoice')}
                      value={
                        header.originalInvoiceId ? (
                          <Link
                            to={`/purchase/purchase-invoices/${header.originalInvoiceId}`}
                            className="purchase-return-detail__invoice-link"
                          >
                            {purchaseReturn?.originalInvoiceNumber?.trim() ||
                              `#${header.originalInvoiceId}`}
                          </Link>
                        ) : (
                          '—'
                        )
                      }
                    />
                    <DetailField
                      label={t('inventory.purchaseReturn.fields.returnDate')}
                      value={header.returnDate}
                      dir="ltr"
                    />
                    <DetailField
                      label={t('inventory.purchaseReturn.fields.reason')}
                      value={
                        header.reason ? getPurchaseReturnReasonLabel(header.reason, t) : '—'
                      }
                    />
                    <DetailField
                      label={t('inventory.purchaseReturn.fields.notes')}
                      value={header.notes?.trim() || '—'}
                      fullWidth
                    />
                  </>
                ) : (
                  <>
                    <PrFormField
                      label={t('inventory.purchaseReturn.fields.originalInvoice')}
                      required={!persistedId}
                      error={fieldErrors.originalInvoiceId}
                    >
                      {originalInvoiceLocked ? (
                        <Link
                          to={`/purchase/purchase-invoices/${header.originalInvoiceId}`}
                          className="purchase-return-detail__invoice-link"
                        >
                          {purchaseReturn?.originalInvoiceNumber?.trim() ||
                            `#${header.originalInvoiceId}`}
                        </Link>
                      ) : lookupsLoading ? (
                        <div className="pi-form-field__skeleton" />
                      ) : (
                        <select
                          className="pi-form-field__select"
                          value={header.originalInvoiceId}
                          onChange={(e) =>
                            setHeader((prev) => ({ ...prev, originalInvoiceId: e.target.value }))
                          }
                        >
                          <option value="">{t('inventory.purchaseReturn.fields.selectOriginalInvoice')}</option>
                          {postedInvoices.map((invoice) => (
                            <option key={invoice.id} value={String(invoice.id)}>
                              {formatInvoiceOption(invoice)}
                            </option>
                          ))}
                        </select>
                      )}
                    </PrFormField>

                    <PrFormField
                      label={t('inventory.purchaseReturn.fields.returnDate')}
                      htmlFor="pr-return-date"
                      required
                      error={fieldErrors.returnDate}
                    >
                      <input
                        id="pr-return-date"
                        type="date"
                        className="pi-form-field__input"
                        dir="ltr"
                        value={header.returnDate}
                        onChange={(e) => setHeader((prev) => ({ ...prev, returnDate: e.target.value }))}
                      />
                    </PrFormField>

                    <PrFormField
                      label={t('inventory.purchaseReturn.fields.reason')}
                      required
                      error={fieldErrors.reason}
                    >
                      <select
                        className="pi-form-field__select"
                        value={header.reason}
                        onChange={(e) =>
                          setHeader((prev) => ({
                            ...prev,
                            reason: e.target.value as PurchaseReturnReason,
                          }))
                        }
                      >
                        <option value="">{t('inventory.purchaseReturn.fields.selectReason')}</option>
                        {RETURN_REASONS.map((value) => (
                          <option key={value} value={value}>
                            {getPurchaseReturnReasonLabel(value, t)}
                          </option>
                        ))}
                      </select>
                    </PrFormField>

                    <PrFormField label={t('inventory.purchaseReturn.fields.notes')} htmlFor="pr-notes">
                      <textarea
                        id="pr-notes"
                        className="pi-form-field__textarea"
                        rows={3}
                        value={header.notes}
                        onChange={(e) => setHeader((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                    </PrFormField>
                  </>
                )}

                {purchaseReturn ? (
                  <div className="pi-form-header-totals">
                    <div className="pi-form-header-totals__row pi-form-header-totals__row--grand">
                      <span>{t('inventory.purchase.totals.total')}</span>
                      <span
                        className="pi-form-header-totals__value pi-form-header-totals__value--grand"
                        dir="ltr"
                      >
                        {formatDisplayAmount(purchaseReturn.totalAmount)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </DocumentHeader>

            <SchemaDocumentLinesCard
              title={t('inventory.purchaseReturn.lines.title')}
              schema={schema}
              lines={lines}
              lookups={{ returnableLines, uoms }}
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
              lookupsLoading={returnableLoading || lookupsLoading}
              interactionLocked={isEditingHeader}
              addDisabled={addUnavailable}
              emptyState={
                <div className="pi-form-lines__empty">
                  <p className="pi-form-lines__empty-title">
                    {t('inventory.purchaseReturn.lines.emptyTitle')}
                  </p>
                  <p className="pi-form-lines__empty-hint">
                    {t('inventory.purchaseReturn.lines.emptyHint')}
                  </p>
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

      <PurchaseDocumentCancelModal
        open={cancelOpen}
        title={t('inventory.purchaseReturn.confirm.cancelTitle')}
        message={t('inventory.purchaseReturn.confirm.cancelMessage')}
        confirmLabel={t('inventory.purchaseReturn.confirm.cancelConfirm')}
        cancelLabel={t('common.cancel')}
        reasonLabel={t('inventory.purchase.confirm.cancelReasonLabel')}
        reasonRequiredMessage={t('inventory.purchase.confirm.cancelReasonRequired')}
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => void handleCancelReturn(reason)}
      />

      <PurchaseDocumentReasonModal
        open={uncompleteModalOpen}
        title={t('inventory.purchaseReturn.confirm.uncompleteTitle')}
        message={t('inventory.purchaseReturn.confirm.uncompleteMessage')}
        confirmLabel={t('inventory.purchaseReturn.confirm.uncompleteConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setUncompleteModalOpen(false)}
        onConfirm={(reason) => void handleUncompleteReturn(reason)}
      />

      <PurchaseDocumentReasonModal
        open={unpostModalOpen}
        title={t('inventory.purchaseReturn.confirm.unpostTitle')}
        message={t('inventory.purchaseReturn.confirm.unpostMessage')}
        confirmLabel={t('inventory.purchaseReturn.confirm.unpostConfirm')}
        cancelLabel={t('inventory.purchase.confirm.back')}
        reasonLabel={t('inventory.purchase.confirm.optionalReasonLabel')}
        confirmVariant="primary"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setUnpostModalOpen(false)}
        onConfirm={(reason) => void handleUnpostReturn(reason)}
      />

      <ConfirmModal
        open={discardModalOpen}
        title={locale === 'ar' ? 'تجاهل التغييرات غير محفوظة؟' : 'Discard unsaved changes?'}
        message={
          locale === 'ar'
            ? 'لديك تغييرات غير محفوظة في بيانات مرتجع الفاتورة. هل تريد تجاهل هذه التغييرات؟'
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

export function PurchaseReturnCreatePage() {
  return <PurchaseReturnForm mode="create" />
}

export function PurchaseReturnViewPage() {
  return <PurchaseReturnForm mode="view" />
}
