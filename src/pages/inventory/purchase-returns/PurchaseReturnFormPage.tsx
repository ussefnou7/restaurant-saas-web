import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Check,
  CheckCircle,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { PurchaseDocumentCancelModal } from '../../../components/inventory/PurchaseDocumentCancelModal'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { ListPage } from '../../../components/ui/ListPage'
import { IconActionButton } from '../../../components/ui/RowActions'
import { useNotify } from '../../../components/ui/NotificationContext'
import { PurchaseInvoiceFormStatusPill } from '../purchase-invoices/PurchaseInvoiceFormStatusPill'
import { useTranslation } from '../../../i18n/useTranslation'
import type { Locale } from '../../../i18n/types'
import * as purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import * as inventoryService from '../../../services/inventoryService'
import * as purchaseReturnService from '../../../services/purchaseReturnService'
import type { PurchaseInvoiceResponse } from '../../../types/purchaseInvoice'
import type { UomResponse } from '../../../types/inventory'
import type {
  PurchaseReturnReason,
  PurchaseReturnResponse,
  ReturnableLineResponse,
} from '../../../types/purchaseReturn'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  canManagePurchaseInvoices,
  canUncompletePurchaseReturns,
  canUnpostPurchaseReturns,
  canViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import { getPurchaseReturnReasonLabel } from '../../../utils/purchaseInvoiceDisplay'
import { convertUomQuantity, getCompatibleUoms } from '../../../utils/inventoryUom'
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

type LineFormState = {
  originalLineId: string
  quantity: string
  uomId: string
  notes: string
}

type FieldErrors = {
  originalInvoiceId?: string
  returnDate?: string
  reason?: string
  lineError?: string
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyHeader(): HeaderFormState {
  return {
    originalInvoiceId: '',
    returnDate: todayDateInput(),
    reason: '',
    notes: '',
  }
}

function emptyLineForm(): LineFormState {
  return {
    originalLineId: '',
    quantity: '',
    uomId: '',
    notes: '',
  }
}

function quantityInOriginalLineUom(
  quantity: number,
  selectedUomId: number,
  originalUomId: number,
  uoms: UomResponse[],
): number | null {
  if (selectedUomId === originalUomId) return quantity
  const fromUom = uoms.find((u) => u.id === selectedUomId)
  const toUom = uoms.find((u) => u.id === originalUomId)
  if (!fromUom || !toUom) return null
  return convertUomQuantity(quantity, fromUom, toUom)
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

function formatReturnableLineLabel(
  line: ReturnableLineResponse,
  locale: Locale,
  uoms: UomResponse[],
): string {
  const material = getInventoryLocalizedName(
    {
      name: line.materialName ?? '',
      code: line.materialCode ?? undefined,
    },
    locale,
  )
  const uomLabel = resolveUomDisplayLabel(line.uomId, line.uomSymbol, locale, uoms)
  return `${material} · ${line.returnableQuantity}${uomLabel ? ` ${uomLabel}` : ''}`.trim()
}

function resolveUomDisplayLabel(
  uomId: number | undefined,
  fallbackSymbol: string | null | undefined,
  locale: Locale,
  uoms: UomResponse[],
): string {
  const uom = uomId != null ? uoms.find((item) => item.id === uomId) : undefined
  if (uom) {
    if (locale === 'ar') {
      return getInventoryLocalizedName(uom, locale) || uom.symbol || uom.code
    }
    return uom.symbol ?? (getInventoryLocalizedName(uom, locale) || uom.code)
  }
  return fallbackSymbol ?? ''
}

function formatQuantityWithUomLabel(
  quantity: number | string | null | undefined,
  uomId: number | undefined,
  fallbackSymbol: string | null | undefined,
  locale: Locale,
  uoms: UomResponse[],
  empty: string,
): string {
  if (quantity == null || quantity === '') return empty
  const uomLabel = resolveUomDisplayLabel(uomId, fallbackSymbol, locale, uoms)
  return uomLabel ? `${quantity} ${uomLabel}` : String(quantity)
}

function formatUomOptionLabel(uom: UomResponse, locale: Locale): string {
  if (locale === 'ar') {
    return getInventoryLocalizedName(uom, locale) || uom.symbol || uom.code
  }
  return uom.symbol ?? (getInventoryLocalizedName(uom, locale) || uom.code)
}

function getMaxReturnQuantity(
  returnableLines: ReturnableLineResponse[],
  purchaseReturn: PurchaseReturnResponse,
  originalLineId: number,
  excludeLineId?: number,
): number {
  const returnable = returnableLines.find((line) => line.originalLineId === originalLineId)
  if (!returnable) return 0

  const draftForSameLine = purchaseReturn.lines
    .filter((line) => line.id !== excludeLineId)
    .filter((line) => line.originalLineId === originalLineId)
    .reduce((sum, line) => sum + line.quantity, 0)

  return Math.max(0, returnable.returnableQuantity - draftForSameLine)
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

  const [purchaseReturn, setPurchaseReturn] = useState<PurchaseReturnResponse | null>(null)
  const [header, setHeader] = useState<HeaderFormState>(emptyHeader)
  const [postedInvoices, setPostedInvoices] = useState<PurchaseInvoiceResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [returnableLines, setReturnableLines] = useState<ReturnableLineResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [returnableLoading, setReturnableLoading] = useState(false)
  const [loading, setLoading] = useState(mode !== 'create')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [unpostModalOpen, setUnpostModalOpen] = useState(false)
  const [uncompleteModalOpen, setUncompleteModalOpen] = useState(false)

  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editLineForm, setEditLineForm] = useState<LineFormState | null>(null)
  const [lineSaving, setLineSaving] = useState(false)
  const [addingLine, setAddingLine] = useState(false)
  const [newLineForm, setNewLineForm] = useState<LineFormState | null>(null)

  const isCreate = mode === 'create'
  const displayStatus = purchaseReturn?.status ?? 'DRAFT'
  const isDraft = displayStatus === 'DRAFT'
  const headerFieldsEnabled = isCreate || isEditingHeader
  const headerInputsDisabled =
    !headerFieldsEnabled || headerSaving || lookupsLoading || actionLoading
  const showLinesSection = !isCreate && purchaseReturn != null
  const showDraftLineActions = isDraft && canManage
  const originalInvoiceLocked = !isCreate

  const loadPostedInvoices = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const [invoiceData, uomData] = await Promise.all([
        purchaseInvoiceService.getPurchaseInvoices({ status: 'POSTED' }),
        inventoryService.getUoms(true),
      ])
      setPostedInvoices(invoiceData)
      setUoms(uomData)
    } catch {
      setPostedInvoices([])
      setUoms([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const loadReturnableLines = useCallback(async () => {
    if (!id || !isDraft) {
      setReturnableLines([])
      return
    }
    setReturnableLoading(true)
    try {
      const data = await purchaseReturnService.getReturnableLines(id)
      setReturnableLines(data)
    } catch (err) {
      setReturnableLines([])
      notify.error(translateApiError(err, t).message)
    } finally {
      setReturnableLoading(false)
    }
  }, [id, isDraft, t, notify])

  const loadReturn = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await purchaseReturnService.getPurchaseReturn(id)
      setPurchaseReturn(data)
      setHeader(mapReturnToHeader(data))
      setIsEditingHeader(false)
      setEditingLineId(null)
      setEditLineForm(null)
      setAddingLine(false)
      setNewLineForm(null)
    } catch (err) {
      setPurchaseReturn(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    if (!canView) return
    void loadPostedInvoices()
  }, [canView, loadPostedInvoices])

  useEffect(() => {
    if (!canView || isCreate) return
    void loadReturn()
  }, [canView, isCreate, loadReturn])

  useEffect(() => {
    if (!canView || isCreate || !isDraft) return
    void loadReturnableLines()
  }, [canView, isCreate, isDraft, loadReturnableLines, purchaseReturn?.lines.length])

  const selectedReturnableLine = newLineForm?.originalLineId
    ? returnableLines.find((line) => String(line.originalLineId) === newLineForm.originalLineId)
    : null

  const availableReturnableLines = returnableLines.filter(
    (line) =>
      !purchaseReturn?.lines.some(
        (existing) => existing.originalLineId === line.originalLineId,
      ),
  )

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

  function validateLineForm(form: LineFormState, requireOriginalLine = true): string | null {
    if (requireOriginalLine && !form.originalLineId) {
      return t('inventory.purchaseReturn.validation.lineRequired')
    }
    const quantity = Number(form.quantity)
    if (!form.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
      return t('inventory.purchaseReturn.validation.returnQuantityRequired')
    }
    if (!form.uomId) {
      return t('inventory.purchase.validation.uomRequired')
    }
    if (purchaseReturn && form.originalLineId) {
      const returnable = returnableLines.find(
        (line) => line.originalLineId === Number(form.originalLineId),
      )
      if (returnable) {
        const maxQty = getMaxReturnQuantity(
          returnableLines,
          purchaseReturn,
          Number(form.originalLineId),
          editingLineId ? Number(editingLineId) : undefined,
        )
        const quantityInOriginalUom = quantityInOriginalLineUom(
          quantity,
          Number(form.uomId),
          returnable.uomId,
          uoms,
        )
        if (quantityInOriginalUom != null && quantityInOriginalUom > maxQty) {
          return t('inventory.purchaseReturn.validation.returnQuantityExceeded')
        }
      }
    }
    return null
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
      if (isCreate) {
        const created = await purchaseReturnService.createPurchaseReturn({
          originalInvoiceId: Number(header.originalInvoiceId),
          ...payload,
        })
        notify.success(t('inventory.purchaseReturn.toast.createSuccess'))
        navigate(`/purchase/purchase-returns/${created.id}`, { replace: true })
        return
      }
      if (!id) return
      const updated = await purchaseReturnService.updatePurchaseReturnHeader(id, {
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

  function handleCancelHeaderEdit() {
    if (purchaseReturn) setHeader(mapReturnToHeader(purchaseReturn))
    setFieldErrors({})
    setIsEditingHeader(false)
  }

  async function handleSaveNewLine() {
    if (!id || !newLineForm) return
    const lineError = validateLineForm(newLineForm, true)
    if (lineError) {
      setFieldErrors({ lineError })
      return
    }
    setFieldErrors({})
    setLineSaving(true)
    try {
      const updated = await purchaseReturnService.addPurchaseReturnLine(id, {
        originalLineId: Number(newLineForm.originalLineId),
        quantity: Number(newLineForm.quantity),
        uomId: Number(newLineForm.uomId),
        notes: newLineForm.notes.trim() || null,
      })
      setPurchaseReturn(updated)
      setAddingLine(false)
      setNewLineForm(null)
      notify.success(t('inventory.purchaseReturn.toast.lineAddSuccess'))
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

  function handleStartEditLine(line: PurchaseReturnResponse['lines'][number]) {
    setAddingLine(false)
    setNewLineForm(null)
    setEditingLineId(String(line.id))
    setEditLineForm({
      originalLineId: String(line.originalLineId),
      quantity: String(line.quantity),
      uomId: String(line.uomId),
      notes: line.notes ?? '',
    })
    setFieldErrors({})
  }

  async function handleSaveEditLine(lineId: number) {
    if (!id || !editLineForm) return
    const lineError = validateLineForm(editLineForm, false)
    if (lineError) {
      setFieldErrors({ lineError })
      return
    }
    setFieldErrors({})
    setLineSaving(true)
    try {
      const updated = await purchaseReturnService.updatePurchaseReturnLine(id, lineId, {
        quantity: Number(editLineForm.quantity),
        uomId: Number(editLineForm.uomId),
        notes: editLineForm.notes.trim() || null,
      })
      setPurchaseReturn(updated)
      setEditingLineId(null)
      setEditLineForm(null)
      notify.success(t('inventory.purchaseReturn.toast.lineUpdateSuccess'))
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
    if (!id || !isDraft) return
    setLineSaving(true)
    try {
      const updated = await purchaseReturnService.deletePurchaseReturnLine(id, lineId)
      setPurchaseReturn(updated)
      if (editingLineId === String(lineId)) {
        setEditingLineId(null)
        setEditLineForm(null)
      }
      notify.success(t('inventory.purchaseReturn.toast.lineDeleteSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setLineSaving(false)
    }
  }

  async function handleCompleteReturn() {
    if (!id || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      const updated = await purchaseReturnService.completePurchaseReturn(id)
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
    if (!id || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      const updated = await purchaseReturnService.postPurchaseReturn(id)
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
    if (!id || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      await purchaseReturnService.uncompletePurchaseReturn(id, reason)
      await loadReturn()
      notify.success(t('inventory.purchaseReturn.toast.uncompleteSuccess'))
      setUncompleteModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnpostReturn(reason?: string) {
    if (!id || displayStatus !== 'POSTED') return
    setActionLoading(true)
    try {
      await purchaseReturnService.unpostPurchaseReturn(id, reason)
      await loadReturn()
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
    if (!id) return
    setActionLoading(true)
    try {
      await purchaseReturnService.cancelPurchaseReturn(id, reason)
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

  function renderLineEditRow(
    form: LineFormState,
    options: {
      returnableLine?: ReturnableLineResponse
      onOriginalLineChange?: (originalLineId: string) => void
      onChange: (patch: Partial<LineFormState>) => void
      onSave: () => void
      onCancel: () => void
    },
  ) {
    const anchorUomId = form.uomId || options.returnableLine?.uomId
    const compatibleUoms = anchorUomId
      ? getCompatibleUoms(uoms, Number(anchorUomId))
      : []
    const qtyUomDisabled = lineSaving || lookupsLoading || !options.returnableLine

    return (
      <>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--material">
          {options.returnableLine ? (
            <div className="pi-form-view-line__material">
              <span className="pi-form-view-line__name">
                {getInventoryLocalizedName(
                  {
                    name: options.returnableLine.materialName ?? '',
                    code: options.returnableLine.materialCode ?? undefined,
                  },
                  locale,
                )}
              </span>
            </div>
          ) : (
            <select
              className="pi-form-line-row__input"
              value={form.originalLineId}
              onChange={(e) => options.onOriginalLineChange?.(e.target.value)}
              disabled={lineSaving || returnableLoading}
            >
              <option value="">{t('inventory.purchaseReturn.lines.selectLine')}</option>
              {availableReturnableLines.map((line) => (
                <option key={line.originalLineId} value={String(line.originalLineId)}>
                  {formatReturnableLineLabel(line, locale, uoms)}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          {options.returnableLine?.originalQuantity ?? t('common.empty.dash')}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          {options.returnableLine
            ? formatQuantityWithUomLabel(
                options.returnableLine.returnableQuantity,
                options.returnableLine.uomId,
                options.returnableLine.uomSymbol,
                locale,
                uoms,
                t('common.empty.dash'),
              )
            : t('common.empty.dash')}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          <input
            type="number"
            min={0}
            step="any"
            className="pi-form-line-row__input pi-form-line-row__input--ltr return-line__qty-input"
            value={form.quantity}
            onChange={(e) => options.onChange({ quantity: e.target.value })}
            disabled={qtyUomDisabled}
            aria-label={t('inventory.purchaseReturn.lines.returnQuantity')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--uom">
          <select
            className="pi-form-line-row__input return-line__uom-select"
            value={form.uomId}
            onChange={(e) => options.onChange({ uomId: e.target.value })}
            disabled={qtyUomDisabled}
            aria-label={t('inventory.purchaseReturn.lines.uom')}
          >
            <option value="">{t('inventory.purchaseReturn.lines.uomPlaceholder')}</option>
            {compatibleUoms.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {formatUomOptionLabel(u, locale)}
              </option>
            ))}
          </select>
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          {t('common.empty.dash')}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          {t('common.empty.dash')}
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--actions">
          <div className="pi-form-lines-table__row-actions">
            <IconActionButton
              className="action-btn action-btn--icon action-btn--confirm"
              label={t('inventory.purchase.form.save')}
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
    <ListPage className="purchase-return-form-page purchase-invoice-form-page purchase-invoice-form-page--redesign">
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

      {!loading ? (
        <>
          {!isCreate && purchaseReturn?.status === 'POSTED' ? (
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
            dir="rtl"
            noValidate
          >
            <section className="pi-form-header-card" dir="rtl">
              <div className="pi-form-header-card__topbar">
                <div className="pi-form-header-card__topbar-start">
                  <h1 className="pi-form-topbar__title">{pageTitle}</h1>
                  <PurchaseInvoiceFormStatusPill status={displayStatus} />
                </div>
                <div className="pi-form-header-card__topbar-end">
                  {!loading && showFormActions ? (
                    <div className="pi-form-topbar__actions-bar">
                      {canManage && id && displayStatus === 'DRAFT' ? (
                        <button
                          type="button"
                          className="pi-form-actions__complete"
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
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <CheckCircle size={16} aria-hidden />
                              {t('inventory.purchase.actions.complete')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canManage && id && displayStatus === 'COMPLETE' ? (
                        <button
                          type="button"
                          className="pi-form-actions__post"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => void handlePostReturn()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Send size={16} aria-hidden />
                              {t('inventory.purchase.actions.post')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canUncomplete && id && displayStatus === 'COMPLETE' ? (
                        <button
                          type="button"
                          className="pi-form-actions__unpost"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setUncompleteModalOpen(true)}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Undo2 size={16} aria-hidden="true" />
                              {t('inventory.purchaseReturn.actions.uncompleteReturn')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canUnpost && id && displayStatus === 'POSTED' ? (
                        <button
                          type="button"
                          className="pi-form-actions__unpost"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => setUnpostModalOpen(true)}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Undo2 size={16} aria-hidden="true" />
                              {t('inventory.purchaseReturn.actions.unpostReturn')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canManage &&
                      id &&
                      (displayStatus === 'DRAFT' || displayStatus === 'COMPLETE') ? (
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--cancel"
                          label={t('inventory.purchase.actions.cancel')}
                          onClick={() => setCancelOpen(true)}
                          disabled={headerSaving || actionLoading || lineSaving}
                        >
                          <RotateCcw size={16} aria-hidden />
                        </IconActionButton>
                      ) : null}
                      {displayStatus !== 'POSTED' ? (
                        <IconActionButton
                          className="action-btn action-btn--icon"
                          label={t('common.cancel')}
                          onClick={() => navigate('/purchase/purchase-returns')}
                          disabled={headerSaving || actionLoading || lineSaving}
                        >
                          <X size={16} aria-hidden />
                        </IconActionButton>
                      ) : null}

                      <span className="pi-form-topbar__actions-divider" aria-hidden />

                      {displayStatus === 'DRAFT' && !isEditingHeader && canManage && id ? (
                        <IconActionButton
                          className="action-btn action-btn--icon"
                          label={t('inventory.purchase.actions.editHeader')}
                          onClick={() => setIsEditingHeader(true)}
                          disabled={headerSaving || lineSaving || actionLoading}
                        >
                          <Pencil size={16} aria-hidden />
                        </IconActionButton>
                      ) : null}
                      {isEditingHeader ? (
                        <>
                          <IconActionButton
                            className="action-btn action-btn--icon action-btn--confirm"
                            label={t('inventory.purchase.form.saveHeader')}
                            onClick={() => void handleSaveHeader()}
                            disabled={headerSaving}
                          >
                            {headerSaving ? (
                              <Loader2 size={16} className="pi-form-actions__submit-spinner" aria-hidden />
                            ) : (
                              <Check size={16} aria-hidden />
                            )}
                          </IconActionButton>
                          <IconActionButton
                            className="action-btn action-btn--icon action-btn--cancel"
                            label={t('common.cancel')}
                            onClick={handleCancelHeaderEdit}
                            disabled={headerSaving}
                          >
                            <X size={16} aria-hidden />
                          </IconActionButton>
                        </>
                      ) : null}
                      {isCreate ? (
                        <button
                          type="button"
                          className="pi-form-actions__submit"
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
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pi-form-header-card__nav">
                <Link to="/purchase/purchase-returns" className="pi-form-topbar__back">
                  <ChevronRight size={18} aria-hidden />
                  {t('inventory.purchaseReturn.form.backToList')}
                </Link>
              </div>

              <div className="pi-form-header-card__divider" />

              {!isCreate && purchaseReturn?.returnNumber ? (
                <div className="pi-form-header-card__invoice-line">
                  <span className="pi-form-header-card__invoice-number" dir="ltr">
                    {purchaseReturn.returnNumber}
                  </span>
                </div>
              ) : null}

              <div className="pi-form-header-grid">
                <PrFormField
                  label={t('inventory.purchaseReturn.fields.originalInvoice')}
                  required={isCreate}
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
                      disabled={headerInputsDisabled}
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
                    disabled={headerInputsDisabled}
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
                    disabled={headerInputsDisabled}
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
                    disabled={headerInputsDisabled}
                  />
                </PrFormField>

                {!isCreate && purchaseReturn ? (
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
            </section>

            {showLinesSection && purchaseReturn ? (
              <section className="pi-form-lines-card">
                <div className="pi-form-lines__header">
                  <h2 className="pi-form-lines__title">{t('inventory.purchaseReturn.lines.title')}</h2>
                </div>

                {purchaseReturn.lines.length === 0 && !addingLine ? (
                  <div className="pi-form-lines__empty">
                    <p className="pi-form-lines__empty-title">
                      {t('inventory.purchaseReturn.lines.emptyTitle')}
                    </p>
                    <p className="pi-form-lines__empty-hint">
                      {t('inventory.purchaseReturn.lines.emptyHint')}
                    </p>
                  </div>
                ) : (
                  <div className="pi-form-lines__table-wrap">
                    <table
                      className={`pi-form-lines-table${showDraftLineActions ? ' pi-form-lines-table--draft' : ' pi-form-lines-table--readonly'}`}
                    >
                      <thead>
                        <tr>
                          <th className="pi-form-lines-table__th">
                            {t('inventory.purchaseReturn.lines.material')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchaseReturn.lines.originalQuantity')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchaseReturn.lines.returnableQuantity')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchaseReturn.lines.returnQuantity')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--uom">
                            {t('inventory.purchaseReturn.lines.uom')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchaseReturn.lines.unitCost')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchaseReturn.lines.lineTotal')}
                          </th>
                          {showDraftLineActions ? (
                            <th className="pi-form-lines-table__th pi-form-lines-table__th--actions">
                              {t('inventory.col.actions')}
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseReturn.lines.map((line) => {
                          const returnableLine = returnableLines.find(
                            (item) => item.originalLineId === line.originalLineId,
                          )
                          const isEditing = editingLineId === String(line.id) && editLineForm

                          if (isEditing && editLineForm) {
                            return (
                              <tr
                                key={line.id}
                                className="pi-form-lines-table__row pi-form-lines-table__row--edit"
                              >
                                {renderLineEditRow(editLineForm, {
                                  returnableLine,
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
                                        name: line.materialName ?? '',
                                        nameAr: line.materialNameAr ?? undefined,
                                        code: line.materialCode ?? undefined,
                                      },
                                      locale,
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {returnableLine?.originalQuantity ?? t('common.empty.dash')}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {returnableLine
                                  ? formatQuantityWithUomLabel(
                                      returnableLine.returnableQuantity,
                                      returnableLine.uomId,
                                      returnableLine.uomSymbol,
                                      locale,
                                      uoms,
                                      t('common.empty.dash'),
                                    )
                                  : t('common.empty.dash')}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {line.quantity}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--uom">
                                {resolveUomDisplayLabel(line.uomId, line.uomSymbol, locale, uoms) ||
                                  t('common.empty.dash')}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {formatDisplayAmount(line.unitCost)}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {formatDisplayAmount(line.lineTotal)}
                              </td>
                              {showDraftLineActions ? (
                                <td className="pi-form-lines-table__td pi-form-lines-table__td--actions">
                                  <div className="pi-form-lines-table__row-actions">
                                    <IconActionButton
                                      className="action-btn action-btn--icon warehouse-stocks-panel__edit-btn"
                                      label={t('inventory.purchase.actions.editLine')}
                                      onClick={() => handleStartEditLine(line)}
                                      disabled={
                                        lineSaving ||
                                        addingLine ||
                                        editingLineId != null ||
                                        isEditingHeader
                                      }
                                    >
                                      <Pencil size={16} aria-hidden />
                                    </IconActionButton>
                                    <IconActionButton
                                      className="action-btn action-btn--icon action-btn--cancel"
                                      label={t('inventory.purchase.lines.delete')}
                                      onClick={() => void handleDeleteLine(line.id)}
                                      disabled={
                                        lineSaving ||
                                        addingLine ||
                                        editingLineId != null ||
                                        isEditingHeader
                                      }
                                    >
                                      <Trash2 size={16} aria-hidden />
                                    </IconActionButton>
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          )
                        })}
                        {addingLine && newLineForm ? (
                          <tr className="pi-form-lines-table__row pi-form-lines-table__row--edit">
                            {renderLineEditRow(newLineForm, {
                              onOriginalLineChange: (originalLineId) => {
                                const returnable = returnableLines.find(
                                  (line) => String(line.originalLineId) === originalLineId,
                                )
                                setNewLineForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        originalLineId,
                                        quantity: '',
                                        uomId: returnable ? String(returnable.uomId) : '',
                                      }
                                    : prev,
                                )
                              },
                              onChange: (patch) =>
                                setNewLineForm((prev) => (prev ? { ...prev, ...patch } : prev)),
                              onSave: () => void handleSaveNewLine(),
                              onCancel: handleCancelNewLine,
                              returnableLine: selectedReturnableLine ?? undefined,
                            })}
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                )}

                {fieldErrors.lineError ? (
                  <p className="pi-form-lines__inline-error">{fieldErrors.lineError}</p>
                ) : null}

                {showDraftLineActions ? (
                  <div className="pi-form-lines__footer">
                    <button
                      type="button"
                      className="pi-form-lines__add-btn"
                      onClick={() => {
                        setAddingLine(true)
                        setNewLineForm(emptyLineForm())
                        setEditingLineId(null)
                        setEditLineForm(null)
                        setFieldErrors({})
                        void loadReturnableLines()
                      }}
                      disabled={
                        lineSaving ||
                        addingLine ||
                        editingLineId != null ||
                        isEditingHeader ||
                        returnableLoading ||
                        availableReturnableLines.length === 0
                      }
                    >
                      <Plus size={16} aria-hidden />
                      {t('inventory.purchaseReturn.lines.add')}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
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
    </ListPage>
  )
}

export function PurchaseReturnCreatePage() {
  return <PurchaseReturnForm mode="create" />
}

export function PurchaseReturnViewPage() {
  return <PurchaseReturnForm mode="view" />
}
