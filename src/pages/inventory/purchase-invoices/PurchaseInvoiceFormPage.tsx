import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Check, CheckCircle, ChevronRight, Loader2, Pencil, Plus, Receipt, Send, Trash2, Undo2, X, XCircle } from 'lucide-react'
import { ListPage } from '../../../components/ui/ListPage'
import { IconActionButton } from '../../../components/ui/RowActions'
import { useNotify } from '../../../components/ui/NotificationContext'
import { PurchaseDocumentReasonModal } from '../../../components/inventory/PurchaseDocumentReasonModal'
import { PurchaseInvoiceMaterialSelect } from './PurchaseInvoiceMaterialSelect'
import { PurchaseInvoiceFormStatusPill } from './PurchaseInvoiceFormStatusPill'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import type { MaterialResponse, SupplierResponse, UomResponse, WarehouseResponse } from '../../../types/inventory'
import type {
  PurchaseInvoiceLineRequest,
  PurchaseInvoiceLineResponse,
  PurchaseInvoiceResponse,
  PurchaseInvoiceStatus,
  UpdatePurchaseInvoiceHeaderRequest,
  UpdatePurchaseInvoiceLineRequest,
} from '../../../types/purchaseInvoice'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatMoney } from '../../../utils/format'
import {
  canManagePurchaseInvoices,
  canUnpostPurchaseInvoices,
  canUncompletePurchaseInvoices,
  canViewPurchaseInvoices,
} from '../../../utils/inventoryPurchaseAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { notifyStockBalancesRefresh } from '../../../utils/inventoryStockRefresh'
import {
  calcLineTotalWithAdjustments,
} from '../../../utils/purchaseInvoiceDisplay'
import {
  getCompatibleUoms,
  resolveDisplayUomId,
} from '../../../utils/inventoryUom'
import { PurchaseInvoiceAccessDenied } from './PurchaseInvoiceAccessDenied'

type FormMode = 'create' | 'edit' | 'view'

type LineFormState = {
  clientId: string
  materialId: string
  quantity: string
  uomId: string
  unitCost: string
  lineDiscount: string
  lineTax: string
}

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
  lineError?: string
}

function toDateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyHeader(): HeaderFormState {
  return {
    supplierId: '',
    warehouseId: '',
    invoiceNumber: '',
    invoiceDate: todayDateInput(),
    receiptDate: todayDateInput(),
    discountAmount: '0',
    taxAmount: '0',
    notes: '',
  }
}

function newLine(): LineFormState {
  return {
    clientId: crypto.randomUUID(),
    materialId: '',
    quantity: '',
    uomId: '',
    unitCost: '',
    lineDiscount: '0',
    lineTax: '0',
  }
}

function mapInvoiceToHeader(invoice: PurchaseInvoiceResponse): HeaderFormState {
  return {
    supplierId: invoice.supplierId != null ? String(invoice.supplierId) : '',
    warehouseId: String(invoice.warehouseId),
    invoiceNumber: invoice.invoiceNumber ?? '',
    invoiceDate: toDateInputValue(invoice.invoiceDate),
    receiptDate: toDateInputValue(invoice.receiptDate) || todayDateInput(),
    discountAmount: String(invoice.discountAmount ?? 0),
    taxAmount: String(invoice.taxAmount ?? 0),
    notes: invoice.notes ?? '',
  }
}

function mapInvoiceLineToForm(line: PurchaseInvoiceLineResponse): LineFormState {
  return {
    clientId: String(line.id),
    materialId: String(line.materialId),
    quantity: String(line.quantity),
    uomId: String(line.uomId),
    unitCost: String(line.unitCost),
    lineDiscount: '0',
    lineTax: '0',
  }
}

function formatDisplayAmount(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return `${formatMoney(value)} ج.م`
}

function calcLineFormTotal(form: LineFormState): number | null {
  const qty = Number(form.quantity)
  const cost = Number(form.unitCost)
  if (!form.quantity.trim() || !form.unitCost.trim() || qty <= 0 || cost <= 0) return null
  return calcLineTotalWithAdjustments(qty, cost, Number(form.lineDiscount) || 0, Number(form.lineTax) || 0)
}

function calcLineFormTotalOrNull(form: LineFormState): number | null {
  return calcLineFormTotal(form)
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
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [loading, setLoading] = useState(mode !== 'create')
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
  const [unpostModalOpen, setUnpostModalOpen] = useState(false)
  const [uncompleteModalOpen, setUncompleteModalOpen] = useState(false)
  const [cancelInvoiceModalOpen, setCancelInvoiceModalOpen] = useState(false)

  const isCreate = mode === 'create'
  const isView = mode === 'view'
  const displayStatus: PurchaseInvoiceStatus = invoice?.status ?? 'DRAFT'
  const isDraft = displayStatus === 'DRAFT'
  const headerFieldsEnabled = isCreate || isEditingHeader
  const headerInputsDisabled = !headerFieldsEnabled || headerSaving || lookupsLoading || actionLoading
  const showLinesSection = !isCreate && invoice != null
  const showDraftLineActions = isDraft && canManage

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
    try {
      const [warehouseData, supplierData, materialData, uomData] = await Promise.all([
        inventoryService.getWarehouses({ active: true }),
        inventoryService.getSuppliers({ active: true }),
        inventoryService.getMaterials({ active: true }),
        inventoryService.getUoms(true),
      ])
      setWarehouses(warehouseData)
      setSuppliers(supplierData)
      setMaterials(materialData)
      setUoms(uomData)
    } catch {
      setWarehouses([])
      setSuppliers([])
      setMaterials([])
      setUoms([])
    } finally {
      setLookupsLoading(false)
    }
  }, [])

  const loadInvoice = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await purchaseInvoiceService.getPurchaseInvoice(id)
      setInvoice(data)
      setHeader(mapInvoiceToHeader(data))
      setIsEditingHeader(false)
      setEditingLineId(null)
      setEditLineForm(null)
      setAddingLine(false)
      setNewLineForm(null)
    } catch (err) {
      setInvoice(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    if (!canView) return
    void loadLookups()
  }, [canView, loadLookups])

  useEffect(() => {
    if (!canView || isCreate) return
    void loadInvoice()
  }, [canView, isCreate, loadInvoice])

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

  function validateLineForm(form: LineFormState, requireMaterial = true): string | null {
    if (requireMaterial && !form.materialId) {
      return t('inventory.purchase.validation.fieldRequired')
    }
    const quantity = Number(form.quantity)
    if (!form.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
      return t('inventory.purchase.validation.quantityRequired')
    }
    if (!form.uomId) return t('inventory.purchase.validation.uomRequired')
    const unitCost = Number(form.unitCost)
    if (form.unitCost.trim() === '' || Number.isNaN(unitCost) || unitCost <= 0) {
      return t('inventory.purchase.validation.unitCostRequired')
    }
    return null
  }

  function buildAddLinePayload(form: LineFormState): PurchaseInvoiceLineRequest {
    return {
      materialId: Number(form.materialId),
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      unitCost: Number(form.unitCost),
    }
  }

  function buildUpdateLinePayload(form: LineFormState): UpdatePurchaseInvoiceLineRequest {
    return {
      quantity: Number(form.quantity),
      uomId: Number(form.uomId),
      unitCost: Number(form.unitCost),
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
      if (isCreate) {
        const created = await purchaseInvoiceService.createPurchaseInvoice(payload)
        setInvoice(created)
        setHeader(mapInvoiceToHeader(created))
        notify.success(t('inventory.purchase.toast.createSuccess'))
        navigate(`/purchase/purchase-invoices/${created.id}`, { replace: true })
        return
      }
      if (!id) return
      const updated = await purchaseInvoiceService.updatePurchaseInvoiceHeader(id, payload)
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

  function handleCancelHeaderEdit() {
    if (invoice) setHeader(mapInvoiceToHeader(invoice))
    setFieldErrors({})
    setIsEditingHeader(false)
  }

  function handleNewLineMaterialChange(materialId: string) {
    const material = materials.find((m) => String(m.id) === materialId)
    const defaultUomId = material ? String(resolveDisplayUomId(material)) : ''
    setNewLineForm((prev) => (prev ? { ...prev, materialId, uomId: defaultUomId } : prev))
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
      const updated = await purchaseInvoiceService.addPurchaseInvoiceLine(id, buildAddLinePayload(newLineForm))
      setInvoice(updated)
      setAddingLine(false)
      setNewLineForm(null)
      notify.success(t('inventory.purchase.toast.lineAddSuccess'))
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

  function handleStartEditLine(line: PurchaseInvoiceLineResponse) {
    setAddingLine(false)
    setNewLineForm(null)
    setEditingLineId(String(line.id))
    setEditLineForm(mapInvoiceLineToForm(line))
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
      const updated = await purchaseInvoiceService.updatePurchaseInvoiceLine(
        id,
        lineId,
        buildUpdateLinePayload(editLineForm),
      )
      setInvoice(updated)
      setEditingLineId(null)
      setEditLineForm(null)
      notify.success(t('inventory.purchase.toast.lineUpdateSuccess'))
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
      const updated = await purchaseInvoiceService.deletePurchaseInvoiceLine(id, lineId)
      setInvoice(updated)
      if (editingLineId === String(lineId)) {
        setEditingLineId(null)
        setEditLineForm(null)
      }
      notify.success(t('inventory.purchase.toast.lineDeleteSuccess'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setLineSaving(false)
    }
  }

  async function handleCompleteInvoice() {
    if (!id || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      const updated = await purchaseInvoiceService.completePurchaseInvoice(id)
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

  async function handlePostInvoice() {
    if (!id || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      const updated = await purchaseInvoiceService.postPurchaseInvoice(id)
      setInvoice(updated)
      notify.success(t('inventory.purchase.toast.postSuccess'))
      notifyStockBalancesRefresh()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUncompleteInvoice(reason?: string) {
    if (!id || displayStatus !== 'COMPLETE') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.uncompletePurchaseInvoice(id, reason)
      await loadInvoice()
      notify.success(t('inventory.purchase.toast.uncompleteSuccess'))
      setUncompleteModalOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteInvoice() {
    if (!id || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.deletePurchaseInvoice(id)
      notify.success(t('inventory.purchase.toast.deleteSuccess'))
      navigate('/purchase/purchase-invoices')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnpostInvoice(reason?: string) {
    if (!id || displayStatus !== 'POSTED') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.unpostPurchaseInvoice(id, reason)
      await loadInvoice()
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
    if (!id || displayStatus !== 'DRAFT') return
    setActionLoading(true)
    try {
      await purchaseInvoiceService.cancelPurchaseInvoice(id, reason)
      await loadInvoice()
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

  function renderLineEditRow(
    form: LineFormState,
    options: {
      materialReadOnly?: PurchaseInvoiceLineResponse
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
                    name: options.materialReadOnly.materialName ?? '',
                    nameAr: options.materialReadOnly.materialNameAr ?? undefined,
                    code: options.materialReadOnly.materialCode ?? undefined,
                  },
                  locale,
                )}
              </span>
            </div>
          ) : (
            <PurchaseInvoiceMaterialSelect
              value={form.materialId}
              onChange={(materialId) => options.onMaterialChange?.(materialId)}
              materials={materials}
              locale={locale}
              disabled={lineSaving}
              loading={lookupsLoading}
              hasError={Boolean(fieldErrors.lineError && !form.materialId)}
              placeholder={t('inventory.purchase.lines.selectMaterial')}
              searchPlaceholder={t('common.search')}
              ariaLabel={t('inventory.purchase.lines.material')}
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
            aria-label={t('inventory.purchase.lines.quantity')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--uom">
          <select
            className="pi-form-line-row__input pi-form-line-row__input--uom"
            value={form.uomId}
            onChange={(e) => options.onChange({ uomId: e.target.value })}
            disabled={lineSaving || lookupsLoading || !form.materialId}
            aria-label={t('inventory.purchase.lines.uom')}
          >
            <option value="">{t('inventory.common.selectUom')}</option>
            {compatibleUoms.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.symbol ?? getInventoryLocalizedName(u, locale)}
              </option>
            ))}
          </select>
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
          <input
            type="number"
            min={0}
            step="any"
            className="pi-form-line-row__input pi-form-line-row__input--ltr"
            value={form.unitCost}
            onChange={(e) => options.onChange({ unitCost: e.target.value })}
            disabled={lineSaving}
            placeholder="0.00"
            aria-label={t('inventory.purchase.lines.unitCost')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
          <input
            type="number"
            min={0}
            step="any"
            className="pi-form-line-row__input pi-form-line-row__input--ltr"
            value={form.lineDiscount}
            onChange={(e) => options.onChange({ lineDiscount: e.target.value })}
            disabled={lineSaving}
            placeholder="0.00"
            aria-label={t('inventory.purchase.lines.lineDiscount')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
          <input
            type="number"
            min={0}
            step="any"
            className="pi-form-line-row__input pi-form-line-row__input--ltr"
            value={form.lineTax}
            onChange={(e) => options.onChange({ lineTax: e.target.value })}
            disabled={lineSaving}
            placeholder="0.00"
            aria-label={t('inventory.purchase.lines.lineTax')}
          />
        </td>
        <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
          {formatDisplayAmount(calcLineFormTotalOrNull(form))}
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
    <ListPage className="purchase-invoice-form-page purchase-invoice-form-page--redesign">
      {loading ? (
        <div className="pi-form-header-card" dir="rtl">
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
                          disabled={headerSaving || actionLoading || lineSaving || isEditingHeader || addingLine || editingLineId != null}
                          onClick={() => void handleCompleteInvoice()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <CheckCircle size={16} aria-hidden="true" />
                              {t('inventory.purchase.actions.approveInvoice')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canManage && id && displayStatus === 'COMPLETE' ? (
                        <button
                          type="button"
                          className="pi-form-actions__post"
                          disabled={headerSaving || actionLoading || lineSaving}
                          onClick={() => void handlePostInvoice()}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="pi-form-actions__submit-spinner" size={16} aria-hidden="true" />
                              {t('common.loading')}
                            </>
                          ) : (
                            <span className="pi-form-actions__icon-text">
                              <Send size={16} aria-hidden="true" />
                              {t('inventory.purchase.actions.postInvoice')}
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
                              {t('inventory.purchase.actions.uncompleteInvoice')}
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
                              {t('inventory.purchase.actions.unpostInvoice')}
                            </span>
                          )}
                        </button>
                      ) : null}
                      {canManage && id && displayStatus === 'DRAFT' ? (
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--cancel"
                          label={t('inventory.purchase.actions.cancelInvoice')}
                          onClick={() => setCancelInvoiceModalOpen(true)}
                          disabled={headerSaving || actionLoading || lineSaving}
                        >
                          <XCircle size={16} aria-hidden />
                        </IconActionButton>
                      ) : null}
                      {canManage && id && displayStatus === 'DRAFT' ? (
                        <IconActionButton
                          className="action-btn action-btn--icon action-btn--cancel"
                          label={t('inventory.purchase.actions.deleteInvoice')}
                          onClick={() => void handleDeleteInvoice()}
                          disabled={headerSaving || actionLoading || lineSaving}
                        >
                          <Trash2 size={16} aria-hidden />
                        </IconActionButton>
                      ) : null}
                      {displayStatus !== 'POSTED' ? (
                        <IconActionButton
                          className="action-btn action-btn--icon"
                          label={t('common.cancel')}
                          onClick={() => navigate('/purchase/purchase-invoices')}
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
                <Link to="/purchase/purchase-invoices" className="pi-form-topbar__back">
                  <ChevronRight size={18} aria-hidden="true" />
                  {t('inventory.purchase.form.backToList')}
                </Link>
              </div>

              <div className="pi-form-header-card__divider" />

              {!isCreate && header.invoiceNumber ? (
                <div className="pi-form-header-card__invoice-line">
                  <span className="pi-form-header-card__invoice-number" dir="ltr">
                    {header.invoiceNumber}
                  </span>
                </div>
              ) : null}

              <div className="pi-form-header-grid">
                <PiFormField label={t('inventory.purchase.fields.supplier')}>
                  {lookupsLoading ? (
                    <div className="pi-form-field__skeleton" />
                  ) : (
                    <select
                      className="pi-form-field__select"
                      value={header.supplierId}
                      onChange={(e) => setHeader((prev) => ({ ...prev, supplierId: e.target.value }))}
                      disabled={headerInputsDisabled}
                    >
                      <option value="">{t('inventory.purchase.fields.supplierOptional')}</option>
                      {supplierOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                  label={t('inventory.purchase.fields.invoiceDate')}
                  htmlFor="pi-invoice-date"
                  required
                  error={fieldErrors.invoiceDate}
                >
                  <input
                    id="pi-invoice-date"
                    type="date"
                    className="pi-form-field__input"
                    dir="ltr"
                    value={header.invoiceDate}
                    onChange={(e) => setHeader((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                    disabled={headerInputsDisabled}
                  />
                </PiFormField>

                <PiFormField
                  label={t('inventory.purchase.fields.receiptDate')}
                  htmlFor="pi-receipt-date"
                  required
                  error={fieldErrors.receiptDate}
                >
                  <input
                    id="pi-receipt-date"
                    type="date"
                    className="pi-form-field__input"
                    dir="ltr"
                    value={header.receiptDate}
                    onChange={(e) => setHeader((prev) => ({ ...prev, receiptDate: e.target.value }))}
                    disabled={headerInputsDisabled}
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
                      disabled={headerInputsDisabled}
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
                      disabled={headerInputsDisabled}
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
                    disabled={headerInputsDisabled}
                  />
                </PiFormField>

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
              </div>
            </section>

            {showLinesSection && invoice ? (
              <section className="pi-form-lines-card">
                <div className="pi-form-lines__header">
                  <h2 className="pi-form-lines__title">{t('inventory.purchase.lines.title')}</h2>
                </div>

                {invoice.lines.length === 0 && !addingLine ? (
                  <div className="pi-form-lines__empty">
                    <Receipt className="pi-form-lines__empty-icon" size={40} strokeWidth={1.25} aria-hidden="true" />
                    <p className="pi-form-lines__empty-title">{t('inventory.purchase.lines.emptyTitle')}</p>
                    <p className="pi-form-lines__empty-hint">{t('inventory.purchase.lines.emptyHint')}</p>
                  </div>
                ) : (
                  <div className="pi-form-lines__table-wrap">
                    <table
                      className={`pi-form-lines-table${showDraftLineActions ? ' pi-form-lines-table--draft' : ' pi-form-lines-table--readonly'}`}
                    >
                      <colgroup>
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--material" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--qty" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--uom" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--cost" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--discount" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--tax" />
                        <col className="pi-form-lines-table__col pi-form-lines-table__col--total" />
                        {showDraftLineActions ? (
                          <col className="pi-form-lines-table__col pi-form-lines-table__col--actions" />
                        ) : null}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="pi-form-lines-table__th">
                            {t('inventory.purchase.lines.material')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchase.lines.quantity')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--uom">
                            {t('inventory.purchase.lines.uom')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchase.lines.unitCost')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchase.lines.lineDiscount')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchase.lines.lineTax')}
                          </th>
                          <th className="pi-form-lines-table__th pi-form-lines-table__th--num">
                            {t('inventory.purchase.lines.lineTotal')}
                          </th>
                          {showDraftLineActions ? (
                            <th className="pi-form-lines-table__th pi-form-lines-table__th--actions">
                              {t('inventory.col.actions')}
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lines.map((line) =>
                          editingLineId === String(line.id) && editLineForm ? (
                            <tr key={line.id} className="pi-form-lines-table__row pi-form-lines-table__row--edit">
                              {renderLineEditRow(editLineForm, {
                                materialReadOnly: line,
                                onChange: (patch) =>
                                  setEditLineForm((prev) => (prev ? { ...prev, ...patch } : prev)),
                                onSave: () => void handleSaveEditLine(line.id),
                                onCancel: handleCancelEditLine,
                              })}
                            </tr>
                          ) : (
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
                                {line.quantity}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--uom">
                                {line.uomSymbol ?? line.uomName ?? line.uomCode ?? t('common.empty.dash')}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num" dir="ltr">
                                {formatDisplayAmount(line.unitCost)}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
                                {t('common.empty.dash')}
                              </td>
                              <td className="pi-form-lines-table__td pi-form-lines-table__td--num">
                                {t('common.empty.dash')}
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
                                      disabled={lineSaving || addingLine || editingLineId != null || isEditingHeader}
                                    >
                                      <Pencil size={16} aria-hidden />
                                    </IconActionButton>
                                    <IconActionButton
                                      className="action-btn action-btn--icon action-btn--cancel"
                                      label={t('inventory.purchase.lines.delete')}
                                      onClick={() => void handleDeleteLine(line.id)}
                                      disabled={lineSaving || addingLine || editingLineId != null || isEditingHeader}
                                    >
                                      <Trash2 size={16} aria-hidden />
                                    </IconActionButton>
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          ),
                        )}
                        {addingLine && newLineForm ? (
                          <tr className="pi-form-lines-table__row pi-form-lines-table__row--edit">
                            {renderLineEditRow(newLineForm, {
                              onMaterialChange: handleNewLineMaterialChange,
                              onChange: (patch) =>
                                setNewLineForm((prev) => (prev ? { ...prev, ...patch } : prev)),
                              onSave: () => void handleSaveNewLine(),
                              onCancel: handleCancelNewLine,
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
                        setNewLineForm(newLine())
                        setEditingLineId(null)
                        setEditLineForm(null)
                        setFieldErrors({})
                      }}
                      disabled={lineSaving || addingLine || editingLineId != null || isEditingHeader}
                    >
                      <Plus size={16} aria-hidden="true" />
                      {t('inventory.purchase.lines.add')}
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
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
