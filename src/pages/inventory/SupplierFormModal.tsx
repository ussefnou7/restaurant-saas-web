import { useEffect, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormTextarea,
  StatusSwitch,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TenantCodeInput } from '../../components/ui/TenantCodeInput'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type { SupplierResponse } from '../../types/inventory'
import { TENANT_ENTITY_PREFIXES } from '../../utils/tenantCode'

type FormMode = 'create' | 'edit'

interface SupplierFormModalProps {
  open: boolean
  mode: FormMode
  supplier?: SupplierResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  code: '',
  name: '',
  nameAr: '',
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  active: true,
  notes: '',
}

export function SupplierFormModal({
  open,
  mode,
  supplier,
  onClose,
  onSuccess,
}: SupplierFormModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return
    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (supplier) {
      setForm({
        code: supplier.code,
        name: supplier.name,
        nameAr: supplier.nameAr ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        taxNumber: supplier.taxNumber ?? '',
        active: supplier.active,
        notes: supplier.notes ?? '',
      })
    }
  }, [open, isCreate, supplier])

  function validate(): string | null {
    if (!form.code.trim()) return t('inventory.suppliers.validation.codeRequired')
    if (!form.name.trim()) return t('inventory.suppliers.validation.nameRequired')
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
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        taxNumber: form.taxNumber.trim() || null,
        active: form.active,
        notes: form.notes.trim() || null,
      }

      if (isCreate) {
        await inventoryService.createSupplier(payload)
      } else if (supplier) {
        await inventoryService.updateSupplier(supplier.id, payload)
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
          ? t('inventory.suppliers.modal.addTitle')
          : t('inventory.suppliers.modal.editTitle')
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="supplier-form" variant="primary" disabled={saving}>
            {saving ? t('branches.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="supplier-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          {isCreate ? (
            <TenantCodeInput
              id="supplier-code"
              label={t('inventory.col.code')}
              entityPrefix={TENANT_ENTITY_PREFIXES.SUP}
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
          <FormField label={t('inventory.col.name')} htmlFor="supplier-name">
            <FormInput
              id="supplier-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('inventory.fields.nameAr')} htmlFor="supplier-name-ar">
            <FormInput
              id="supplier-name-ar"
              dir="rtl"
              value={form.nameAr}
              onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
              placeholder={t('inventory.fields.nameArPlaceholder')}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.col.phone')} htmlFor="supplier-phone">
            <FormInput
              id="supplier-phone"
              type="tel"
              ltr
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.col.email')} htmlFor="supplier-email">
            <FormInput
              id="supplier-email"
              type="email"
              ltr
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.suppliers.fields.address')} htmlFor="supplier-address" fullWidth>
            <FormTextarea
              id="supplier-address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              rows={2}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('inventory.suppliers.fields.taxNumber')} htmlFor="supplier-tax">
            <FormInput
              id="supplier-tax"
              type="text"
              ltr
              value={form.taxNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, taxNumber: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('common.status')}>
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          </FormField>
          <FormField label={t('inventory.suppliers.fields.notes')} htmlFor="supplier-notes" fullWidth>
            <FormTextarea
              id="supplier-notes"
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
