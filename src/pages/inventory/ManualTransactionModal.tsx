import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormSelect, FormTextarea } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import * as inventoryStockService from '../../services/inventoryStockService'
import type { MaterialResponse, UomResponse, WarehouseResponse } from '../../types/inventory'
import type { ManualTransactionPrefill, ManualTransactionType } from '../../types/inventoryStock'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import {
  MANUAL_TRANSACTION_TYPES,
  getTransactionTypeLabel,
  toLocalDateTimeInputValue,
} from '../../utils/inventoryStockDisplay'
import {
  getCompatibleUoms,
  getDisplayUomLabel,
  resolveDisplayUomId,
} from '../../utils/inventoryUom'

type FormState = {
  transactionType: ManualTransactionType | ''
  warehouseId: string
  materialId: string
  quantity: string
  uomId: string
  unitCost: string
  transactionDate: string
  notes: string
}

const emptyForm = (): FormState => ({
  transactionType: 'MANUAL_IN',
  warehouseId: '',
  materialId: '',
  quantity: '',
  uomId: '',
  unitCost: '',
  transactionDate: toLocalDateTimeInputValue(),
  notes: '',
})

interface ManualTransactionModalProps {
  open: boolean
  prefill?: ManualTransactionPrefill | null
  onClose: () => void
  onSuccess: () => void
}

export function ManualTransactionModal({
  open,
  prefill,
  onClose,
  onSuccess,
}: ManualTransactionModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    setError('')
    setForm({
      ...emptyForm(),
      warehouseId: prefill?.warehouseId != null ? String(prefill.warehouseId) : '',
      materialId: prefill?.materialId != null ? String(prefill.materialId) : '',
      uomId: prefill?.uomId != null ? String(prefill.uomId) : '',
    })

    setLookupsLoading(true)
    void Promise.all([
      inventoryService.getWarehouses({ active: true }),
      inventoryService.getMaterials({ active: true }),
      inventoryService.getUoms(true),
    ])
      .then(([warehouseData, materialData, uomData]) => {
        setWarehouses(warehouseData)
        setMaterials(materialData)
        setUoms(uomData)
      })
      .catch(() => {
        setWarehouses([])
        setMaterials([])
        setUoms([])
      })
      .finally(() => setLookupsLoading(false))
  }, [open, prefill?.materialId, prefill?.uomId, prefill?.warehouseId])

  const selectedMaterial = useMemo(
    () => materials.find((m) => String(m.id) === form.materialId),
    [form.materialId, materials],
  )

  const showUnitCost = form.transactionType !== 'MANUAL_OUT'

  useEffect(() => {
    if (!selectedMaterial) return
    setForm((prev) => {
      if (prev.materialId !== String(selectedMaterial.id)) return prev
      if (prefill?.uomId && prev.uomId === String(prefill.uomId)) return prev
      return { ...prev, uomId: String(resolveDisplayUomId(selectedMaterial)) }
    })
  }, [prefill?.uomId, selectedMaterial])

  const compatibleUoms = useMemo(() => {
    if (!form.uomId) return uoms.filter((u) => u.active)
    return getCompatibleUoms(uoms, form.uomId)
  }, [form.uomId, uoms])

  const transactionTypeOptions = useMemo(
    () =>
      MANUAL_TRANSACTION_TYPES.map((type) => ({
        value: type,
        label: getTransactionTypeLabel(type, t),
      })),
    [t],
  )

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((w) => ({
        value: String(w.id),
        label: getInventoryLocalizedName(w, locale),
      })),
    [locale, warehouses],
  )

  const materialOptions = useMemo(
    () =>
      materials.map((m) => ({
        value: String(m.id),
        label: getInventoryLocalizedName(m, locale),
      })),
    [locale, materials],
  )

  const uomOptions = useMemo(
    () =>
      compatibleUoms.map((u) => ({
        value: String(u.id),
        label: u.symbol
          ? `${getInventoryLocalizedName(u, locale)} (${u.symbol})`
          : getInventoryLocalizedName(u, locale),
      })),
    [compatibleUoms, locale],
  )

  const displayUomHint = selectedMaterial
    ? getDisplayUomLabel(selectedMaterial, locale, uoms)
    : null

  function validate(): string | null {
    if (!form.transactionType) return t('inventory.stock.manual.validation.typeRequired')
    if (!form.warehouseId) return t('inventory.stock.manual.validation.warehouseRequired')
    if (!form.materialId) return t('inventory.stock.manual.validation.materialRequired')
    const quantity = Number(form.quantity)
    if (!form.quantity.trim() || Number.isNaN(quantity) || quantity <= 0) {
      return t('inventory.stock.manual.validation.quantityRequired')
    }
    if (!form.uomId) return t('inventory.stock.manual.validation.uomRequired')
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const unitCostTrimmed = form.unitCost.trim()
    const unitCost =
      showUnitCost && unitCostTrimmed ? Number(unitCostTrimmed) : undefined

    setSaving(true)
    try {
      await inventoryStockService.createManualTransaction({
        transactionType: form.transactionType as ManualTransactionType,
        warehouseId: Number(form.warehouseId),
        materialId: Number(form.materialId),
        quantity: Number(form.quantity),
        uomId: Number(form.uomId),
        unitCost: unitCost != null && !Number.isNaN(unitCost) ? unitCost : null,
        transactionDate: form.transactionDate ? `${form.transactionDate}:00` : null,
        notes: form.notes.trim() || null,
      })
      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="medium"
      title={t('inventory.stock.manual.modal.title')}
      subtitle={t('inventory.stock.manual.modal.subtitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="manual-transaction-form"
            variant="primary"
            disabled={saving || lookupsLoading}
          >
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="manual-transaction-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}

        <FieldGrid columns={2}>
          <FormField label={t('inventory.stock.manual.fields.transactionType')} fullWidth>
            <FormSelect
              value={form.transactionType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  transactionType: e.target.value as ManualTransactionType,
                  unitCost: e.target.value === 'MANUAL_OUT' ? '' : prev.unitCost,
                }))
              }
              disabled={saving || lookupsLoading}
            >
              {transactionTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={t('inventory.stock.manual.fields.warehouse')}>
            <FormSelect
              value={form.warehouseId}
              onChange={(e) => setForm((prev) => ({ ...prev, warehouseId: e.target.value }))}
              disabled={saving || lookupsLoading}
            >
              <option value="">{t('inventory.common.selectWarehouse')}</option>
              {warehouseOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label={t('inventory.stock.manual.fields.material')}>
            <FormSelect
              value={form.materialId}
              onChange={(e) => setForm((prev) => ({ ...prev, materialId: e.target.value }))}
              disabled={saving || lookupsLoading}
            >
              <option value="">{t('inventory.common.selectMaterial')}</option>
              {materialOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            {displayUomHint ? (
              <p className="form-hint">
                {t('inventory.stock.manual.displayUomHint', { uom: displayUomHint })}
              </p>
            ) : null}
          </FormField>

          <FormField label={t('inventory.stock.manual.fields.quantity')} htmlFor="txn-quantity">
            <FormInput
              id="txn-quantity"
              type="number"
              min={0}
              step="any"
              ltr
              value={form.quantity}
              onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>

          <FormField label={t('inventory.stock.manual.fields.uom')}>
            <FormSelect
              value={form.uomId}
              onChange={(e) => setForm((prev) => ({ ...prev, uomId: e.target.value }))}
              disabled={saving || lookupsLoading || !form.materialId}
            >
              <option value="">{t('inventory.common.selectUom')}</option>
              {uomOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
            {selectedMaterial ? (
              <p className="form-hint">{t('inventory.stock.manual.convertHint')}</p>
            ) : null}
          </FormField>

          {showUnitCost ? (
            <FormField label={t('inventory.stock.manual.fields.unitCost')} htmlFor="txn-unit-cost">
              <FormInput
                id="txn-unit-cost"
                type="number"
                min={0}
                step="any"
                ltr
                value={form.unitCost}
                onChange={(e) => setForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                disabled={saving}
              />
            </FormField>
          ) : null}

          <FormField label={t('inventory.stock.manual.fields.transactionDate')} htmlFor="txn-date">
            <FormInput
              id="txn-date"
              type="datetime-local"
              ltr
              value={form.transactionDate}
              onChange={(e) => setForm((prev) => ({ ...prev, transactionDate: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>

          <FormField label={t('inventory.stock.manual.fields.notes')} htmlFor="txn-notes" fullWidth>
            <FormTextarea
              id="txn-notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
