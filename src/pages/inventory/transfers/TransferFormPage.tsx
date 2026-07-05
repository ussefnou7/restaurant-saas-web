import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { FieldGrid, FormField, FormInput, FormSelect, FormTextarea } from '../../../components/fields'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useNotify } from '../../../components/ui/NotificationContext'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as transferService from '../../../services/inventoryTransferService'
import type { MaterialResponse, UomResponse, WarehouseResponse } from '../../../types/inventory'
import type {
  CreateInventoryTransferRequest,
  CreateTransferLineRequest,
  InventoryTransferResponse,
} from '../../../types/inventoryOperations'
import { formatDate } from '../../../utils/format'
import { canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { StockAccessDenied } from '../StockAccessDenied'

type FormMode = 'create' | 'view'

type LineFormState = {
  clientId: string
  materialId: string
  quantity: string
  uomId: string
  notes: string
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function newLine(): LineFormState {
  return {
    clientId: crypto.randomUUID(),
    materialId: '',
    quantity: '',
    uomId: '',
    notes: '',
  }
}

function getStatusVariant(status: string): 'muted' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'DRAFT': return 'muted'
    case 'IN_TRANSIT': return 'warning'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'danger'
    default: return 'muted'
  }
}

function TransferFormInner({ mode, transfer }: { mode: FormMode; transfer: InventoryTransferResponse | null }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [lookupLoading, setLookupLoading] = useState(true)

  const [sourceWarehouseId, setSourceWarehouseId] = useState(
    transfer ? String(transfer.sourceWarehouseId) : '',
  )
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(
    transfer ? String(transfer.destinationWarehouseId) : '',
  )
  const [requestedDate, setRequestedDate] = useState(
    transfer ? transfer.requestedDate.slice(0, 10) : todayDateInput(),
  )
  const [notes, setNotes] = useState(transfer?.notes ?? '')
  const [lines, setLines] = useState<LineFormState[]>(() => {
    if (transfer?.lines?.length) {
      return transfer.lines.map((l) => ({
        clientId: String(l.id),
        materialId: String(l.materialId),
        quantity: String(l.requestedQuantity),
        uomId: String(l.uomId),
        notes: l.notes ?? '',
      }))
    }
    return [newLine()]
  })

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadLookups() {
      try {
        const [ws, mats, uomList] = await Promise.all([
          inventoryService.getWarehouses({ active: true }),
          inventoryService.getMaterials({ active: true }),
          inventoryService.getUoms(true),
        ])
        setWarehouses(ws)
        setMaterials(mats)
        setUoms(uomList)
      } finally {
        setLookupLoading(false)
      }
    }
    void loadLookups()
  }, [])

  function addLine() {
    setLines((prev) => [...prev, newLine()])
  }

  function removeLine(clientId: string) {
    setLines((prev) => prev.filter((l) => l.clientId !== clientId))
  }

  function updateLine(clientId: string, field: keyof LineFormState, value: string) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.clientId !== clientId) return l
        const updated = { ...l, [field]: value }
        if (field === 'materialId') {
          const mat = materials.find((m) => String(m.id) === value)
          if (mat) {
            const displayUomId = mat.displayUomId ?? mat.defaultUomId ?? mat.stockUomId
            updated.uomId = displayUomId ? String(displayUomId) : ''
          }
        }
        return updated
      }),
    )
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!sourceWarehouseId) {
      setFormError(t('inventory.transfers.validation.sourceRequired'))
      return false
    }
    if (!destinationWarehouseId) {
      setFormError(t('inventory.transfers.validation.destinationRequired'))
      return false
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      setFormError(t('inventory.transfers.validation.sameWarehouse'))
      return false
    }
    if (!requestedDate) {
      setFormError(t('inventory.transfers.validation.dateRequired'))
      return false
    }
    if (lines.length === 0) {
      setFormError(t('inventory.transfers.validation.linesRequired'))
      return false
    }
    for (const line of lines) {
      if (!line.materialId) {
        errors[line.clientId] = t('inventory.transfers.validation.materialRequired')
      } else if (!line.quantity || parseFloat(line.quantity) <= 0) {
        errors[line.clientId] = t('inventory.transfers.validation.quantityRequired')
      } else if (!line.uomId) {
        errors[line.clientId] = t('inventory.transfers.validation.uomRequired')
      }
    }
    setLineErrors(errors)
    if (Object.keys(errors).length > 0) return false
    setFormError('')
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload: CreateInventoryTransferRequest = {
        sourceWarehouseId: parseInt(sourceWarehouseId),
        destinationWarehouseId: parseInt(destinationWarehouseId),
        requestedDate,
        notes: notes.trim() || undefined,
        lines: lines.map((l): CreateTransferLineRequest => ({
          materialId: parseInt(l.materialId),
          requestedQuantity: parseFloat(l.quantity),
          uomId: parseInt(l.uomId),
          notes: l.notes.trim() || undefined,
        })),
      }
      const created = await transferService.createTransfer(payload)
      notify.success(t('inventory.transfers.toast.createSuccess'))
      navigate(`/inventory/transfers/${created.id}`)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const warehouseOptions = warehouses.map((w) => ({
    value: String(w.id),
    label: getInventoryLocalizedName(w, locale),
  }))

  const isView = mode === 'view'

  return (
    <ListPage className="transfer-form-page">
      <PageHeader
        title={
          isView
            ? t('inventory.transfers.form.viewTitle')
            : t('inventory.transfers.form.createTitle')
        }
        description={
          isView && transfer
            ? `${t('inventory.transfers.col.code')}: ${transfer.code}`
            : t('inventory.transfers.form.subtitle')
        }
        action={
          <Link to="/inventory/transfers">
            <Button variant="secondary" type="button">
              {t('inventory.transfers.form.backToList')}
            </Button>
          </Link>
        }
      />

      {isView && transfer ? (
        <div className="transfer-detail">
          <div className="transfer-detail__header">
            <div className="transfer-detail__route">
              <span className="transfer-detail__warehouse">
                {getInventoryLocalizedName(
                  { name: transfer.sourceWarehouseName, nameAr: transfer.sourceWarehouseNameAr ?? undefined },
                  locale,
                )}
              </span>
              <ArrowRight className="transfer-detail__arrow" size={18} />
              <span className="transfer-detail__warehouse">
                {getInventoryLocalizedName(
                  { name: transfer.destinationWarehouseName, nameAr: transfer.destinationWarehouseNameAr ?? undefined },
                  locale,
                )}
              </span>
            </div>
            <Badge variant={getStatusVariant(transfer.status)}>
              {t(`inventory.transfers.status.${transfer.status}`)}
            </Badge>
          </div>

          <div className="transfer-detail__meta">
            <div className="transfer-detail__meta-item">
              <span className="transfer-detail__meta-label">{t('inventory.transfers.col.requestedDate')}</span>
              <span className="transfer-detail__meta-value" dir="ltr">{formatDate(transfer.requestedDate)}</span>
            </div>
            {transfer.dispatchedAt ? (
              <div className="transfer-detail__meta-item">
                <span className="transfer-detail__meta-label">{t('inventory.transfers.col.dispatchedAt')}</span>
                <span className="transfer-detail__meta-value" dir="ltr">{formatDate(transfer.dispatchedAt)}</span>
              </div>
            ) : null}
            {transfer.receivedAt ? (
              <div className="transfer-detail__meta-item">
                <span className="transfer-detail__meta-label">{t('inventory.transfers.col.receivedAt')}</span>
                <span className="transfer-detail__meta-value" dir="ltr">{formatDate(transfer.receivedAt)}</span>
              </div>
            ) : null}
            {transfer.notes ? (
              <div className="transfer-detail__meta-item transfer-detail__meta-item--full">
                <span className="transfer-detail__meta-label">{t('inventory.transfers.fields.notes')}</span>
                <span className="transfer-detail__meta-value">{transfer.notes}</span>
              </div>
            ) : null}
          </div>

          {transfer.lines && transfer.lines.length > 0 ? (
            <div className="transfer-detail__lines">
              <h3 className="transfer-detail__lines-title">{t('inventory.transfers.lines.title')}</h3>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <Th column="entity">{t('inventory.transfers.lines.material')}</Th>
                    <Th>{t('inventory.transfers.lines.requested')}</Th>
                    <Th>{t('inventory.transfers.lines.dispatched')}</Th>
                    <Th>{t('inventory.transfers.lines.received')}</Th>
                    <Th>{t('inventory.transfers.lines.uom')}</Th>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfer.lines.map((line) => (
                    <TableRow key={line.id}>
                      <Td column="entity">
                        <span>{getInventoryLocalizedName({ name: line.materialName, nameAr: line.materialNameAr ?? undefined }, locale)}</span>
                        <span className="entity-cell__code">{line.materialCode}</span>
                      </Td>
                      <Td dir="ltr">{line.requestedQuantity}</Td>
                      <Td dir="ltr">{line.dispatchedQuantity ?? <span className="text-muted">—</span>}</Td>
                      <Td dir="ltr">{line.receivedQuantity ?? <span className="text-muted">—</span>}</Td>
                      <Td>{line.uomSymbol ?? line.uomCode}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </div>
          ) : null}
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="transfer-form">
          {formError ? <div className="form-error-banner">{formError}</div> : null}

          <div className="form-section">
            <h3 className="form-section__title">{t('inventory.transfers.form.headerSection')}</h3>
            <FieldGrid>
              <FormField label={t('inventory.transfers.fields.source')} required>
                <FormSelect
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  disabled={lookupLoading || saving}
                >
                  <option value="">{t('inventory.common.selectWarehouse')}</option>
                  {warehouseOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label={t('inventory.transfers.fields.destination')} required>
                <FormSelect
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  disabled={lookupLoading || saving}
                >
                  <option value="">{t('inventory.common.selectWarehouse')}</option>
                  {warehouseOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label={t('inventory.transfers.fields.requestedDate')} required>
                <FormInput
                  type="date"
                  ltr
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  disabled={saving}
                />
              </FormField>
              <FormField label={t('inventory.transfers.fields.notes')}>
                <FormTextarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  rows={2}
                />
              </FormField>
            </FieldGrid>
          </div>

          <div className="form-section">
            <div className="form-section__header">
              <h3 className="form-section__title">{t('inventory.transfers.lines.title')}</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addLine} disabled={saving}>
                <Plus size={14} />
                {t('inventory.transfers.lines.add')}
              </Button>
            </div>

            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('inventory.transfers.lines.material')}</Th>
                  <Th>{t('inventory.transfers.lines.quantity')}</Th>
                  <Th>{t('inventory.transfers.lines.uom')}</Th>
                  <Th>{t('inventory.transfers.lines.notes')}</Th>
                  <Th></Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line) => {
                  const matOptions = materials.map((m) => ({
                    value: String(m.id),
                    label: getInventoryLocalizedName(m, locale),
                  }))
                  const selectedMat = materials.find((m) => String(m.id) === line.materialId)
                  const uomOptions = uoms.map((u) => ({
                    value: String(u.id),
                    label: `${u.symbol ?? u.code} — ${u.name}`,
                  }))
                  return (
                    <TableRow key={line.clientId}>
                      <Td column="entity">
                        <FormSelect
                          value={line.materialId}
                          onChange={(e) => updateLine(line.clientId, 'materialId', e.target.value)}
                          disabled={saving || lookupLoading}
                          aria-invalid={!!lineErrors[line.clientId]}
                        >
                          <option value="">{t('inventory.common.selectMaterial')}</option>
                          {matOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </FormSelect>
                        {lineErrors[line.clientId] ? (
                          <span className="field-error">{lineErrors[line.clientId]}</span>
                        ) : null}
                      </Td>
                      <Td>
                        <FormInput
                          type="number"
                          ltr
                          min="0.001"
                          step="any"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.clientId, 'quantity', e.target.value)}
                          disabled={saving}
                          placeholder="0"
                        />
                      </Td>
                      <Td>
                        <FormSelect
                          value={line.uomId}
                          onChange={(e) => updateLine(line.clientId, 'uomId', e.target.value)}
                          disabled={saving || lookupLoading}
                        >
                          <option value="">{t('inventory.common.selectUom')}</option>
                          {uomOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </FormSelect>
                        {selectedMat?.stockUomSymbol ? (
                          <span className="transfer-form__stock-hint" dir="ltr">
                            {t('inventory.purchase.lines.stockUomHint', { uom: selectedMat.stockUomSymbol ?? selectedMat.stockUomCode ?? '' })}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <FormInput
                          type="text"
                          value={line.notes}
                          onChange={(e) => updateLine(line.clientId, 'notes', e.target.value)}
                          disabled={saving}
                          placeholder={t('inventory.transfers.lines.notesPlaceholder')}
                        />
                      </Td>
                      <Td>
                        {lines.length > 1 ? (
                          <button
                            type="button"
                            className="transfer-form__remove-line"
                            onClick={() => removeLine(line.clientId)}
                            disabled={saving}
                            aria-label={t('inventory.transfers.lines.remove')}
                          >
                            <Minus size={14} />
                          </button>
                        ) : null}
                      </Td>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          </div>

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={saving || lookupLoading}>
              {saving ? t('common.loading') : t('inventory.transfers.form.submit')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/inventory/transfers')}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      )}
    </ListPage>
  )
}

export function TransferCreatePage() {
  const canView = canViewInventoryStock()
  if (!canView) return <StockAccessDenied />
  return <TransferFormInner mode="create" transfer={null} />
}

export function TransferViewPage() {
  const { id } = useParams<{ id: string }>()
  const canView = canViewInventoryStock()
  const [transfer, setTransfer] = useState<InventoryTransferResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const data = await transferService.getTransfer(id!)
        setTransfer(data)
      } catch {
        setError(t('inventory.transfers.loadError'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, t])

  if (!canView) return <StockAccessDenied />
  if (loading) return <ListPage><div className="page-loading">{t('common.loading')}</div></ListPage>
  if (error || !transfer) return (
    <ListPage>
      <div className="page-error-banner">{error || t('common.notFound')}</div>
      <Button variant="secondary" onClick={() => navigate('/inventory/transfers')}>{t('inventory.transfers.form.backToList')}</Button>
    </ListPage>
  )
  return <TransferFormInner mode="view" transfer={transfer} />
}
