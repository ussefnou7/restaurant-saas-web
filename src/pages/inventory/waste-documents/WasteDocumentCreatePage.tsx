import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useNotify } from '../../../components/ui/NotificationContext'
import { FieldGrid, FormField, FormInput, FormSelect, FormTextarea } from '../../../components/fields'
import { useTranslation } from '../../../i18n/useTranslation'
import * as inventoryService from '../../../services/inventoryService'
import * as wasteDocumentService from '../../../services/wasteDocumentService'
import type { WarehouseResponse } from '../../../types/inventory'
import { WASTE_REASON_CODES, type WasteReasonCode } from '../../../types/wasteDocument'
import { canManageInventoryStock, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { StockAccessDenied } from '../StockAccessDenied'

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

export function WasteDocumentCreatePage() {
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [lookupLoading, setLookupLoading] = useState(true)
  const [warehouseId, setWarehouseId] = useState('')
  const [wasteDate, setWasteDate] = useState(todayDateInput())
  const [reasonCode, setReasonCode] = useState<WasteReasonCode>('SPOILED')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function loadLookups() {
      try {
        const ws = await inventoryService.getWarehouses({ active: true })
        setWarehouses(ws)
      } finally {
        setLookupLoading(false)
      }
    }
    void loadLookups()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canManage) return
    if (!warehouseId) {
      setFormError(t('inventory.waste.validation.warehouseRequired'))
      return
    }
    if (!wasteDate) {
      setFormError(t('inventory.waste.validation.dateRequired'))
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const created = await wasteDocumentService.createWasteDocument({
        warehouseId: parseInt(warehouseId, 10),
        wasteDate,
        reasonCode,
        notes: notes.trim() || undefined,
      })
      notify.success(t('inventory.waste.toast.createSuccess'))
      navigate(`/inventory/waste-documents/${created.id}`)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  if (!canView) return <StockAccessDenied />

  return (
    <ListPage className="waste-document-form-page">
      <PageHeader
        title={t('inventory.waste.form.createTitle')}
        description={t('inventory.waste.form.createSubtitle')}
        action={
          <Link to="/inventory/waste-documents">
            <Button variant="secondary" type="button">
              {t('inventory.waste.form.backToList')}
            </Button>
          </Link>
        }
      />

      <form onSubmit={(e) => void handleSubmit(e)} className="waste-document-form">
        {formError ? <div className="form-error-banner">{formError}</div> : null}
        <FieldGrid>
          <FormField label={`${t('inventory.waste.fields.warehouse')} *`}>
            <FormSelect
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={lookupLoading || saving || !canManage}
            >
              <option value="">{t('inventory.common.selectWarehouse')}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={String(warehouse.id)}>
                  {getInventoryLocalizedName(warehouse, locale)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={`${t('inventory.waste.fields.wasteDate')} *`}>
            <FormInput
              type="date"
              ltr
              value={wasteDate}
              onChange={(e) => setWasteDate(e.target.value)}
              disabled={saving || !canManage}
            />
          </FormField>
          <FormField label={`${t('inventory.waste.fields.reasonCode')} *`}>
            <FormSelect
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as WasteReasonCode)}
              disabled={saving || !canManage}
            >
              {WASTE_REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`inventory.waste.reasonCode.${code}`)}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('inventory.waste.fields.notes')}>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving || !canManage}
              rows={2}
            />
          </FormField>
        </FieldGrid>

        {canManage ? (
          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={saving || lookupLoading}>
              {saving ? t('common.loading') : t('inventory.waste.form.submit')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/inventory/waste-documents')}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
          </div>
        ) : null}
      </form>
    </ListPage>
  )
}
