import { useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import { translateApiError } from '../../utils/errors'

interface AssetLineFormModalProps {
  open: boolean
  assetId: number
  onClose: () => void
  onSaved: () => void
}

export function AssetLineFormModal({ open, assetId, onClose, onSaved }: AssetLineFormModalProps) {
  const { t } = useTranslation()
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await assetService.createAssetLine(assetId, {
        label: label.trim() || undefined,
        quantity: quantity.trim(),
        unitCost: unitCost.trim(),
        purchaseDate,
      })
      setLabel('')
      setQuantity('')
      setUnitCost('')
      setPurchaseDate('')
      onSaved()
      onClose()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('assets.lines.addTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="asset-line-form"
            disabled={saving || !quantity.trim() || !unitCost.trim() || !purchaseDate}
          >
            {saving ? t('assets.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      {error ? <div className="page-error-banner">{error}</div> : null}
      <form id="asset-line-form" className="asset-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>{t('assets.lines.label')}</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} />
        </label>
        <label className="form-field">
          <span>{t('assets.lines.quantity')}</span>
          <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="form-field">
          <span>{t('assets.lines.unitCost')}</span>
          <input inputMode="decimal" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} required />
        </label>
        <label className="form-field">
          <span>{t('assets.lines.purchaseDate')}</span>
          <input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} required />
        </label>
      </form>
    </Modal>
  )
}
