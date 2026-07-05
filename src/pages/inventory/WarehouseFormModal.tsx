import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  StatusSwitch,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TenantCodeInput } from '../../components/ui/TenantCodeInput'
import type { TranslationKey } from '../../i18n/types'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { WarehouseResponse, WarehouseType } from '../../types/inventory'
import { buildBranchOptions, getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { TENANT_ENTITY_PREFIXES } from '../../utils/tenantCode'

const WAREHOUSE_TYPES: WarehouseType[] = [
  'CENTRAL',
  'BRANCH',
  'KITCHEN',
  'FREEZER',
  'BAR',
  'OTHER',
]

type FormMode = 'create' | 'edit'

interface WarehouseFormModalProps {
  open: boolean
  mode: FormMode
  warehouse?: WarehouseResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  type: 'CENTRAL' as WarehouseType,
  branchId: '',
  active: true,
  notes: '',
}

export function WarehouseFormModal({
  open,
  mode,
  warehouse,
  onClose,
  onSuccess,
}: WarehouseFormModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return
    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (warehouse) {
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        nameAr: warehouse.nameAr ?? '',
        type: warehouse.type,
        branchId: warehouse.branchId != null ? String(warehouse.branchId) : '',
        active: warehouse.active,
        notes: warehouse.notes ?? '',
      })
    }
  }, [open, isCreate, warehouse])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadBranches() {
      setLoadingBranches(true)
      try {
        const data = await branchService.getBranches()
        if (!cancelled) {
          setBranches(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(translateApiError(err, t).message)
          setBranches([])
        }
      } finally {
        if (!cancelled) {
          setLoadingBranches(false)
        }
      }
    }

    void loadBranches()

    return () => {
      cancelled = true
    }
  }, [open, t])

  const typeOptions = useMemo(
    () =>
      WAREHOUSE_TYPES.map((type) => ({
        value: type,
        label: t(`inventory.warehouses.types.${type}` as TranslationKey),
      })),
    [t],
  )

  const branchOptions = useMemo(() => {
    const selectable = buildBranchOptions(branches, warehouse?.branchId ?? null)
    const emptyLabel = loadingBranches
      ? t('users.placeholders.loadingBranches')
      : t('inventory.common.selectBranch')

    return [
      { value: '', label: emptyLabel },
      ...selectable.map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    ]
  }, [branches, loadingBranches, locale, t, warehouse?.branchId])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.warehouses.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.warehouses.validation.nameRequired')
    if (!form.type) return t('inventory.warehouses.validation.typeRequired')
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

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        type: form.type,
        branchId: form.branchId ? Number(form.branchId) : null,
        active: form.active,
        notes: form.notes.trim() || null,
      }

      if (isCreate) {
        await inventoryService.createWarehouse(payload)
      } else if (warehouse) {
        await inventoryService.updateWarehouse(warehouse.id, payload)
      }
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
      title={
        isCreate
          ? t('inventory.warehouses.modal.addTitle')
          : t('inventory.warehouses.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="warehouse-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="warehouse-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          {isCreate ? (
            <TenantCodeInput
              id="warehouse-code"
              label={t('inventory.col.code')}
              entityPrefix={TENANT_ENTITY_PREFIXES.WH}
              value={form.code}
              onChange={(code) => setForm((prev) => ({ ...prev, code }))}
              disabled={saving}
              required
            />
          ) : (
            <FormField label={t('inventory.col.code')}>
              <FormInput type="text" ltr value={form.code} readOnly disabled />
            </FormField>
          )}
          <FormField label={t('inventory.col.name')} htmlFor="warehouse-name">
            <FormInput
              id="warehouse-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="warehouse-name-ar">
            <FormInput
              id="warehouse-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.col.type')}>
            <FormSelect
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as WarehouseType }))
              }
              disabled={saving}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.col.branch')}>
            <FormSelect
              value={form.branchId}
              onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}
              disabled={saving || loadingBranches}
            >
              {branchOptions.map((opt) => (
                <option key={opt.value || 'empty'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('common.status')}>
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          </FormField>
          <FormField label={t('inventory.warehouses.fields.notes')} htmlFor="warehouse-notes" fullWidth>
            <FormTextarea
              id="warehouse-notes"
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
