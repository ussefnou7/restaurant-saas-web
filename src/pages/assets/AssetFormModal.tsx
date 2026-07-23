import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import * as branchService from '../../services/branchService'
import type { AssetCategory, AssetResponse } from '../../types/assets'
import type { BranchResponse } from '../../types/branch'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'

const categories: AssetCategory[] = ['FURNITURE', 'KITCHEN_EQUIPMENT', 'FINISHING', 'ELECTRONICS', 'OTHER']

interface AssetFormModalProps {
  open: boolean
  asset?: AssetResponse | null
  onClose: () => void
  onSaved: () => void
}

export function AssetFormModal({ open, asset, onClose, onSaved }: AssetFormModalProps) {
  const { t, locale } = useTranslation()
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [category, setCategory] = useState<AssetCategory>('FURNITURE')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setName(asset?.name ?? '')
      setNameAr(asset?.nameAr ?? '')
      setCategory(asset?.category ?? 'FURNITURE')
      setBranchId(asset ? String(asset.branchId) : '')
      setError('')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [asset, open])

  useEffect(() => {
    if (!open || asset) return
    let ignore = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      branchService.getBranches()
        .then((data) => {
          if (ignore) return
          const activeBranches = data.filter((branch) => branch.active)
          setBranches(activeBranches)
          if (!branchId && activeBranches.length === 1) {
            setBranchId(String(activeBranches[0].id))
          }
        })
        .catch((err) => {
          if (!ignore) setError(translateApiError(err, t).message)
        })
        .finally(() => {
          if (!ignore) setLoading(false)
        })
    }, 0)
    return () => {
      ignore = true
      window.clearTimeout(timer)
    }
  }, [asset, branchId, open, t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (asset) {
        await assetService.updateAsset(asset.id, {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          category,
        })
      } else {
        await assetService.createAsset({
          branchId: Number(branchId),
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          category,
        })
      }
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
      title={asset ? t('assets.form.editTitle') : t('assets.form.createTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="asset-form" disabled={saving || loading || !name.trim() || (!asset && !branchId)}>
            {saving ? t('assets.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      {error ? <div className="page-error-banner">{error}</div> : null}
      <form id="asset-form" className="asset-form" onSubmit={handleSubmit}>
        {!asset ? (
          <label className="form-field">
            <span>{t('assets.form.branch')}</span>
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)} required>
              <option value="">{t('assets.form.selectBranch')}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {getInventoryLocalizedName(branch, locale)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="form-field">
          <span>{t('assets.form.name')}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="form-field">
          <span>{t('assets.form.nameAr')}</span>
          <input value={nameAr} onChange={(event) => setNameAr(event.target.value)} dir="rtl" />
        </label>
        <label className="form-field">
          <span>{t('assets.form.category')}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as AssetCategory)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {t(`assets.category.${item}`)}
              </option>
            ))}
          </select>
        </label>
      </form>
    </Modal>
  )
}
