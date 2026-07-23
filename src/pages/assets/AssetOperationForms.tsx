import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import type {
  AssetDisposalReason,
  AssetLineResponse,
  AssetResponse,
} from '../../types/assets'
import {
  compareDecimalStrings,
  formatAssetLineLabel,
  getAssetDisposalReasonLabel,
} from '../../utils/assetDisplay'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'

const disposalReasons: AssetDisposalReason[] = ['DAMAGED', 'LOST', 'OBSOLETE', 'SOLD']

type OperationMode = 'modal' | 'page'

interface SharedOperationProps {
  open?: boolean
  mode?: OperationMode
  initialAssetId?: number | null
  initialLineId?: number | null
  onClose?: () => void
  onSaved?: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function useAssetLineSelection(initialAssetId?: number | null, initialLineId?: number | null) {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [lines, setLines] = useState<AssetLineResponse[]>([])
  const [assetId, setAssetId] = useState(initialAssetId ? String(initialAssetId) : '')
  const [lineId, setLineId] = useState(initialLineId ? String(initialLineId) : '')
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [loadingLines, setLoadingLines] = useState(false)
  const [loadError, setLoadError] = useState('')

  const selectedLine = useMemo(
    () => lines.find((line) => String(line.id) === lineId) ?? null,
    [lineId, lines],
  )

  const loadAssets = useCallback(async () => {
    setLoadingAssets(true)
    setLoadError('')
    try {
      setAssets(await assetService.getAssets())
    } catch (err) {
      setLoadError(translateApiError(err, t).message)
    } finally {
      setLoadingAssets(false)
    }
  }, [t])

  const loadLines = useCallback(async (nextAssetId: string, preferredLineId?: string) => {
    if (!nextAssetId) {
      setLines([])
      setLineId('')
      return
    }
    setLoadingLines(true)
    setLoadError('')
    try {
      const data = await assetService.getAssetLines(nextAssetId)
      setLines(data)
      const activeLines = data.filter((line) => line.status === 'ACTIVE')
      const hasPreferred = preferredLineId && data.some((line) => String(line.id) === preferredLineId)
      if (hasPreferred) {
        setLineId(preferredLineId)
      } else if (activeLines.length === 1) {
        setLineId(String(activeLines[0].id))
      } else {
        setLineId('')
      }
    } catch (err) {
      setLoadError(translateApiError(err, t).message)
      setLines([])
      setLineId('')
    } finally {
      setLoadingLines(false)
    }
  }, [t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAssetId(initialAssetId ? String(initialAssetId) : '')
      setLineId(initialLineId ? String(initialLineId) : '')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialAssetId, initialLineId])

  return {
    assets,
    lines,
    assetId,
    lineId,
    selectedLine,
    loadingAssets,
    loadingLines,
    loadError,
    setAssetId,
    setLineId,
    loadAssets,
    loadLines,
  }
}

interface OperationShellProps extends SharedOperationProps {
  title: string
  children: (close: () => void) => ReactElement
}

function OperationShell({ open = true, mode = 'modal', title, children, onClose }: OperationShellProps) {
  const navigate = useNavigate()
  const close = useCallback(() => {
    if (onClose) {
      onClose()
    } else if (mode === 'page') {
      navigate('/assets')
    }
  }, [mode, navigate, onClose])

  if (mode === 'page') {
    return (
      <div className="page list-page assets-page">
        <div className="asset-operation-page">
          <h1>{title}</h1>
          {children(close)}
        </div>
      </div>
    )
  }

  return (
    <Modal open={open} title={title} onClose={close} size="medium">
      {children(close)}
    </Modal>
  )
}

export function AssetDisposalForm({
  open = true,
  mode = 'modal',
  initialAssetId,
  initialLineId,
  onClose,
  onSaved,
}: SharedOperationProps) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const selection = useAssetLineSelection(initialAssetId, initialLineId)
  const { assetId, loadAssets, loadLines } = selection
  const [quantityDisposed, setQuantityDisposed] = useState('')
  const [reason, setReason] = useState<AssetDisposalReason>('DAMAGED')
  const [disposalDate, setDisposalDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => void loadAssets(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAssets, open])

  useEffect(() => {
    if (!open) return
    const preferredLineId =
      initialAssetId && String(initialAssetId) === assetId && initialLineId
        ? String(initialLineId)
        : undefined
    const timer = window.setTimeout(() => void loadLines(assetId, preferredLineId), 0)
    return () => window.clearTimeout(timer)
  }, [assetId, initialAssetId, initialLineId, loadLines, open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const selectedLine = selection.selectedLine
    const comparison =
      selectedLine && quantityDisposed.trim()
        ? compareDecimalStrings(quantityDisposed, selectedLine.remainingQuantity)
        : null
    if (comparison !== null && comparison > 0) {
      setError(t('assets.disposal.validation.quantityExceeded'))
      return
    }

    setSaving(true)
    setError('')
    try {
      await assetService.createAssetDisposal({
        assetId: Number(selection.assetId),
        assetLineId: Number(selection.lineId),
        quantityDisposed: quantityDisposed.trim(),
        reason,
        disposalDate,
        notes: notes.trim() || undefined,
      })
      onSaved?.()
      if (onClose) {
        onClose()
      } else if (mode === 'page') {
        navigate('/assets')
      }
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <OperationShell
      open={open}
      mode={mode}
      title={t('assets.disposal.title')}
      onClose={onClose}
    >
      {(close) => (
        <form className="asset-disposal-form asset-operation-form" onSubmit={handleSubmit}>
          {selection.loadError || error ? (
            <div className="page-error-banner">{error || selection.loadError}</div>
          ) : null}
          <AssetLinePickers selection={selection} locale={locale} />
          <label className="form-field">
            <span>{t('assets.disposal.quantityDisposed')}</span>
            <input
              inputMode="decimal"
              value={quantityDisposed}
              onChange={(event) => setQuantityDisposed(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>{t('assets.disposal.reason')}</span>
            <select value={reason} onChange={(event) => setReason(event.target.value as AssetDisposalReason)}>
              {disposalReasons.map((item) => (
                <option key={item} value={item}>
                  {getAssetDisposalReasonLabel(item, t)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{t('assets.disposal.disposalDate')}</span>
            <input type="date" value={disposalDate} onChange={(event) => setDisposalDate(event.target.value)} required />
          </label>
          <label className="form-field form-field--wide">
            <span>{t('assets.disposal.notes')}</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
          </label>
          <div className="asset-operation-form__actions">
            <Button variant="secondary" onClick={close} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                selection.loadingAssets ||
                selection.loadingLines ||
                !selection.assetId ||
                !selection.lineId ||
                !quantityDisposed.trim() ||
                !disposalDate
              }
            >
              {saving ? t('assets.actions.saving') : t('assets.disposal.submit')}
            </Button>
          </div>
        </form>
      )}
    </OperationShell>
  )
}

export function AssetMaintenanceForm({
  open = true,
  mode = 'modal',
  initialAssetId,
  initialLineId,
  onClose,
  onSaved,
}: SharedOperationProps) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const selection = useAssetLineSelection(initialAssetId, initialLineId)
  const { assetId, loadAssets, loadLines } = selection
  const [cost, setCost] = useState('')
  const [maintenanceDate, setMaintenanceDate] = useState(today())
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => void loadAssets(), 0)
    return () => window.clearTimeout(timer)
  }, [loadAssets, open])

  useEffect(() => {
    if (!open) return
    const preferredLineId =
      initialAssetId && String(initialAssetId) === assetId && initialLineId
        ? String(initialLineId)
        : undefined
    const timer = window.setTimeout(() => void loadLines(assetId, preferredLineId), 0)
    return () => window.clearTimeout(timer)
  }, [assetId, initialAssetId, initialLineId, loadLines, open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await assetService.createAssetMaintenance({
        assetId: Number(selection.assetId),
        assetLineId: Number(selection.lineId),
        cost: cost.trim(),
        maintenanceDate,
        description: description.trim() || undefined,
        vendor: vendor.trim() || undefined,
      })
      onSaved?.()
      if (onClose) {
        onClose()
      } else if (mode === 'page') {
        navigate('/assets')
      }
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <OperationShell
      open={open}
      mode={mode}
      title={t('assets.maintenance.title')}
      onClose={onClose}
    >
      {(close) => (
        <form className="asset-maintenance-form asset-operation-form" onSubmit={handleSubmit}>
          {selection.loadError || error ? (
            <div className="page-error-banner">{error || selection.loadError}</div>
          ) : null}
          <AssetLinePickers selection={selection} locale={locale} />
          <label className="form-field">
            <span>{t('assets.maintenance.cost')}</span>
            <input inputMode="decimal" value={cost} onChange={(event) => setCost(event.target.value)} required />
          </label>
          <label className="form-field">
            <span>{t('assets.maintenance.maintenanceDate')}</span>
            <input type="date" value={maintenanceDate} onChange={(event) => setMaintenanceDate(event.target.value)} required />
          </label>
          <label className="form-field">
            <span>{t('assets.maintenance.vendor')}</span>
            <input value={vendor} onChange={(event) => setVendor(event.target.value)} />
          </label>
          <label className="form-field form-field--wide">
            <span>{t('assets.maintenance.description')}</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </label>
          <div className="asset-operation-form__actions">
            <Button variant="secondary" onClick={close} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                selection.loadingAssets ||
                selection.loadingLines ||
                !selection.assetId ||
                !selection.lineId ||
                !cost.trim() ||
                !maintenanceDate
              }
            >
              {saving ? t('assets.actions.saving') : t('assets.maintenance.submit')}
            </Button>
          </div>
        </form>
      )}
    </OperationShell>
  )
}

function AssetLinePickers({
  selection,
  locale,
}: {
  selection: ReturnType<typeof useAssetLineSelection>
  locale: 'en' | 'ar'
}) {
  const { t } = useTranslation()
  return (
    <>
      <label className="form-field">
        <span>{t('assets.operation.asset')}</span>
        <select
          value={selection.assetId}
          onChange={(event) => {
            selection.setAssetId(event.target.value)
          }}
          disabled={selection.loadingAssets}
          required
        >
          <option value="">{t('assets.operation.selectAsset')}</option>
          {selection.assets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {getInventoryLocalizedName(asset, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-field">
        <span>{t('assets.operation.line')}</span>
        <select
          value={selection.lineId}
          onChange={(event) => selection.setLineId(event.target.value)}
          disabled={!selection.assetId || selection.loadingLines}
          required
        >
          <option value="">{t('assets.operation.selectLine')}</option>
          {selection.lines.map((line) => (
            <option key={line.id} value={line.id}>
              {formatAssetLineLabel(line.label, line.id, t)}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

export function AssetDisposalPage() {
  const [searchParams] = useSearchParams()
  const assetId = searchParams.get('assetId')
  const lineId = searchParams.get('lineId')
  return (
    <AssetDisposalForm
      mode="page"
      initialAssetId={assetId ? Number(assetId) : null}
      initialLineId={lineId ? Number(lineId) : null}
    />
  )
}

export function AssetMaintenancePage() {
  const [searchParams] = useSearchParams()
  const assetId = searchParams.get('assetId')
  const lineId = searchParams.get('lineId')
  return (
    <AssetMaintenanceForm
      mode="page"
      initialAssetId={assetId ? Number(assetId) : null}
      initialLineId={lineId ? Number(lineId) : null}
    />
  )
}
