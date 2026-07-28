import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
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
  formatDecimalString,
  getAssetDisposalReasonLabel,
} from '../../utils/assetDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'

const disposalReasons: AssetDisposalReason[] = ['DAMAGED', 'LOST', 'OBSOLETE', 'SOLD']

type OperationStep = 'asset' | 'line' | 'fields'

interface SharedOperationProps {
  open?: boolean
  initialAssetId?: number | null
  initialLineId?: number | null
  onClose?: () => void
  onSaved?: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function initialStep(initialAssetId?: number | null, initialLineId?: number | null): OperationStep {
  if (initialAssetId && initialLineId) return 'fields'
  if (initialAssetId) return 'line'
  return 'asset'
}

function useAssetLineSelection(
  open: boolean,
  initialAssetId?: number | null,
  initialLineId?: number | null,
) {
  const { t } = useTranslation()
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [lines, setLines] = useState<AssetLineResponse[]>([])
  const [assetId, setAssetId] = useState(initialAssetId ? String(initialAssetId) : '')
  const [lineId, setLineId] = useState(initialLineId ? String(initialLineId) : '')
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [loadingLines, setLoadingLines] = useState(false)
  const [loadError, setLoadError] = useState('')

  const selectedAsset = useMemo(
    () => assets.find((asset) => String(asset.id) === assetId) ?? null,
    [assetId, assets],
  )

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
      const hasPreferred = preferredLineId && data.some((line) => String(line.id) === preferredLineId)
      setLineId(hasPreferred ? preferredLineId : '')
    } catch (err) {
      setLoadError(translateApiError(err, t).message)
      setLines([])
      setLineId('')
    } finally {
      setLoadingLines(false)
    }
  }, [t])

  useEffect(() => {
    if (!open) return
    setAssetId(initialAssetId ? String(initialAssetId) : '')
    setLineId(initialLineId ? String(initialLineId) : '')
    setLoadError('')
    const timer = window.setTimeout(() => void loadAssets(), 0)
    return () => window.clearTimeout(timer)
  }, [initialAssetId, initialLineId, loadAssets, open])

  useEffect(() => {
    if (!open || !assetId) return
    const preferredLineId =
      initialAssetId && String(initialAssetId) === assetId && initialLineId
        ? String(initialLineId)
        : undefined
    const timer = window.setTimeout(() => void loadLines(assetId, preferredLineId), 0)
    return () => window.clearTimeout(timer)
  }, [assetId, initialAssetId, initialLineId, loadLines, open])

  return {
    assets,
    lines,
    assetId,
    lineId,
    selectedAsset,
    selectedLine,
    loadingAssets,
    loadingLines,
    loadError,
    setAssetId,
    setLineId,
  }
}

function lineOptionLabel(line: AssetLineResponse, t: (key: string, values?: Record<string, string | number>) => string) {
  return t('assets.operation.lineOption', {
    label: formatAssetLineLabel(line.label, line.id, t),
    purchaseDate: formatDate(line.purchaseDate),
    unitCost: formatDecimalString(line.unitCost),
    remainingQuantity: formatDecimalString(line.remainingQuantity),
  })
}

function StepIndicator({ step }: { step: OperationStep }) {
  const { t } = useTranslation()
  const steps: OperationStep[] = ['asset', 'line', 'fields']
  return (
    <ol className="asset-operation-steps" aria-label={t('assets.operation.steps')}>
      {steps.map((item, index) => (
        <li
          key={item}
          className={`asset-operation-steps__item${item === step ? ' asset-operation-steps__item--active' : ''}`}
        >
          <span>{index + 1}</span>
          {t(`assets.operation.step.${item}`)}
        </li>
      ))}
    </ol>
  )
}

function AssetStep({
  assets,
  assetId,
  loading,
  onAssetChange,
}: {
  assets: AssetResponse[]
  assetId: string
  loading: boolean
  onAssetChange: (value: string) => void
}) {
  const { t, locale } = useTranslation()
  return (
    <div className="asset-operation-step">
      <label className="form-field">
        <span>{t('assets.operation.asset')}</span>
        <Dropdown
          value={assetId}
          onChange={onAssetChange}
          options={[
            { value: '', label: t('assets.operation.selectAsset') },
            ...assets.map((asset) => ({
              value: String(asset.id),
              label: getInventoryLocalizedName(asset, locale),
            })),
          ]}
          ariaLabel={t('assets.operation.asset')}
          disabled={loading}
          searchable
          searchPlaceholder={t('common.search')}
        />
      </label>
    </div>
  )
}

function DisposalLineStep({
  lines,
  lineId,
  loading,
  disabled,
  onLineChange,
}: {
  lines: AssetLineResponse[]
  lineId: string
  loading: boolean
  disabled: boolean
  onLineChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="asset-operation-step">
      <label className="form-field form-field--wide">
        <span>{t('assets.operation.line')}</span>
        <select
          value={lineId}
          onChange={(event) => onLineChange(event.target.value)}
          disabled={disabled || loading}
          required
        >
          <option value="">{t('assets.operation.selectLine')}</option>
          {lines.map((line) => (
            <option
              key={line.id}
              value={line.id}
              disabled={compareDecimalStrings(line.remainingQuantity, '0') === 0}
            >
              {lineOptionLabel(line, t)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function MaintenanceLineStep({
  lines,
  lineId,
  loading,
  disabled,
  onLineChange,
}: {
  lines: AssetLineResponse[]
  lineId: string
  loading: boolean
  disabled: boolean
  onLineChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="asset-operation-step">
      <label className="form-field form-field--wide">
        <span>{t('assets.operation.line')}</span>
        <select
          value={lineId}
          onChange={(event) => onLineChange(event.target.value)}
          disabled={disabled || loading}
          required
        >
          <option value="">{t('assets.operation.selectLine')}</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {lineOptionLabel(line, t)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function AssetDisposalForm({
  open = true,
  initialAssetId,
  initialLineId,
  onClose,
  onSaved,
}: SharedOperationProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const selection = useAssetLineSelection(open, initialAssetId, initialLineId)
  const [step, setStep] = useState<OperationStep>(initialStep(initialAssetId, initialLineId))
  const [quantityDisposed, setQuantityDisposed] = useState('')
  const [reason, setReason] = useState<AssetDisposalReason>('DAMAGED')
  const [disposalDate, setDisposalDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(initialStep(initialAssetId, initialLineId))
    setQuantityDisposed('')
    setReason('DAMAGED')
    setDisposalDate(today())
    setNotes('')
    setError('')
  }, [initialAssetId, initialLineId, open])

  const close = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      navigate('/assets/disposals')
    }
  }, [navigate, onClose])

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
      close()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={t('assets.disposal.title')} onClose={close} size="medium">
      <form className="asset-disposal-form asset-operation-form" onSubmit={handleSubmit}>
        <StepIndicator step={step} />
        {selection.loadError || error ? (
          <div className="page-error-banner asset-operation-form__error">
            {error || selection.loadError}
          </div>
        ) : null}

        {step === 'asset' ? (
          <AssetStep
            assets={selection.assets}
            assetId={selection.assetId}
            loading={selection.loadingAssets}
            onAssetChange={(value) => {
              selection.setAssetId(value)
              selection.setLineId('')
            }}
          />
        ) : null}

        {step === 'line' ? (
          <DisposalLineStep
            lines={selection.lines}
            lineId={selection.lineId}
            loading={selection.loadingLines}
            disabled={!selection.assetId}
            onLineChange={selection.setLineId}
          />
        ) : null}

        {step === 'fields' ? (
          <>
            <label className="form-field">
              <span>{t('assets.disposal.quantityDisposed')}</span>
              <input
                inputMode="decimal"
                value={quantityDisposed}
                max={selection.selectedLine?.remainingQuantity}
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
              <input
                type="date"
                value={disposalDate}
                onChange={(event) => setDisposalDate(event.target.value)}
                required
              />
            </label>
            <label className="form-field form-field--wide">
              <span>{t('assets.disposal.notes')}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
          </>
        ) : null}

        <div className="asset-operation-form__actions">
          <Button variant="secondary" onClick={close} disabled={saving}>
            {t('common.cancel')}
          </Button>
          {step !== 'asset' ? (
            <Button
              variant="secondary"
              onClick={() => setStep(step === 'fields' ? 'line' : 'asset')}
              disabled={saving}
            >
              <ArrowLeft size={16} aria-hidden />
              {t('assets.operation.back')}
            </Button>
          ) : null}
          {step !== 'fields' ? (
            <Button
              onClick={() => setStep(step === 'asset' ? 'line' : 'fields')}
              disabled={step === 'asset' ? !selection.assetId : !selection.lineId}
            >
              {t('assets.operation.next')}
              <ArrowRight size={16} aria-hidden />
            </Button>
          ) : (
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
          )}
        </div>
      </form>
    </Modal>
  )
}

export function AssetMaintenanceForm({
  open = true,
  initialAssetId,
  initialLineId,
  onClose,
  onSaved,
}: SharedOperationProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const selection = useAssetLineSelection(open, initialAssetId, initialLineId)
  const [step, setStep] = useState<OperationStep>(initialStep(initialAssetId, initialLineId))
  const [cost, setCost] = useState('')
  const [maintenanceDate, setMaintenanceDate] = useState(today())
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(initialStep(initialAssetId, initialLineId))
    setCost('')
    setMaintenanceDate(today())
    setDescription('')
    setVendor('')
    setError('')
  }, [initialAssetId, initialLineId, open])

  const close = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      navigate('/assets/maintenance')
    }
  }, [navigate, onClose])

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
      close()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={t('assets.maintenance.title')} onClose={close} size="medium">
      <form className="asset-maintenance-form asset-operation-form" onSubmit={handleSubmit}>
        <StepIndicator step={step} />
        {selection.loadError || error ? (
          <div className="page-error-banner asset-operation-form__error">
            {error || selection.loadError}
          </div>
        ) : null}

        {step === 'asset' ? (
          <AssetStep
            assets={selection.assets}
            assetId={selection.assetId}
            loading={selection.loadingAssets}
            onAssetChange={(value) => {
              selection.setAssetId(value)
              selection.setLineId('')
            }}
          />
        ) : null}

        {step === 'line' ? (
          <MaintenanceLineStep
            lines={selection.lines}
            lineId={selection.lineId}
            loading={selection.loadingLines}
            disabled={!selection.assetId}
            onLineChange={selection.setLineId}
          />
        ) : null}

        {step === 'fields' ? (
          <>
            <label className="form-field">
              <span>{t('assets.maintenance.cost')}</span>
              <input inputMode="decimal" value={cost} onChange={(event) => setCost(event.target.value)} required />
            </label>
            <label className="form-field">
              <span>{t('assets.maintenance.maintenanceDate')}</span>
              <input
                type="date"
                value={maintenanceDate}
                onChange={(event) => setMaintenanceDate(event.target.value)}
                required
              />
            </label>
            <label className="form-field">
              <span>{t('assets.maintenance.vendor')}</span>
              <input value={vendor} onChange={(event) => setVendor(event.target.value)} />
            </label>
            <label className="form-field form-field--wide">
              <span>{t('assets.maintenance.description')}</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </label>
          </>
        ) : null}

        <div className="asset-operation-form__actions">
          <Button variant="secondary" onClick={close} disabled={saving}>
            {t('common.cancel')}
          </Button>
          {step !== 'asset' ? (
            <Button
              variant="secondary"
              onClick={() => setStep(step === 'fields' ? 'line' : 'asset')}
              disabled={saving}
            >
              <ArrowLeft size={16} aria-hidden />
              {t('assets.operation.back')}
            </Button>
          ) : null}
          {step !== 'fields' ? (
            <Button
              onClick={() => setStep(step === 'asset' ? 'line' : 'fields')}
              disabled={step === 'asset' ? !selection.assetId : !selection.lineId}
            >
              {t('assets.operation.next')}
              <ArrowRight size={16} aria-hidden />
            </Button>
          ) : (
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
          )}
        </div>
      </form>
    </Modal>
  )
}

export function AssetDisposalPage() {
  const [searchParams] = useSearchParams()
  return <Navigate to={`/assets/disposals${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} replace />
}

export function AssetMaintenancePage() {
  const [searchParams] = useSearchParams()
  return <Navigate to={`/assets/maintenance${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} replace />
}
