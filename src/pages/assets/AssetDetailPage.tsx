import { Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DetailField } from '../../components/fields'
import { DetailHeader } from '../../components/entity-detail/DetailHeader'
import { SchemaDocumentLinesCard } from '../../components/layout/DocumentLayout/SchemaDocumentLinesCard'
import { createAssetLineSchema } from '../../schemas/assetLineSchema'
import type { AssetLineFormState } from '../../schemas/assetLineSchema'
import { useDocumentLines } from '../../hooks/useDocumentLines'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ListPage } from '../../components/ui/ListPage'
import { IconActionButton } from '../../components/ui/RowActions'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import * as branchService from '../../services/branchService'
import type { AssetCategory, AssetResponse, AssetStatus, CreateAssetLineRequest } from '../../types/assets'
import type { BranchResponse } from '../../types/branch'
import {
  formatDecimalString,
  getAssetCategoryLabel,
} from '../../utils/assetDisplay'
import { getLocalizedBranchName, resolveBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetStatusBadge } from './AssetBadges'
import { AssetDisposalForm, AssetMaintenanceForm } from './AssetOperationForms'

type LineAction =
  | { kind: 'dispose'; line: AssetLineFormState }
  | { kind: 'maintenance'; line: AssetLineFormState }
  | null

interface PiFormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

function PiFormField({ label, htmlFor, required, error, children }: PiFormFieldProps) {
  return (
    <div className={`pi-form-field${error ? ' pi-form-field--error' : ''}`}>
      <label htmlFor={htmlFor} className="pi-form-field__label">
        {label}
        {required ? <span className="pi-form-field__required">*</span> : null}
      </label>
      {children}
      {error ? <span className="pi-form-field__error">{error}</span> : null}
    </div>
  )
}

const ASSET_CATEGORIES: AssetCategory[] = [
  'FURNITURE',
  'KITCHEN_EQUIPMENT',
  'FINISHING',
  'ELECTRONICS',
  'OTHER',
]

function getTodayInputDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AssetDetailPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { assetId } = useParams()
  const isCreate = !assetId || assetId === 'new'
  const numericAssetId = Number(assetId)

  const [asset, setAsset] = useState<AssetResponse | null>(null)
  const [initialLines, setInitialLines] = useState<AssetLineFormState[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(!isCreate)
  const [actionLoading, setActionLoading] = useState(false)
  const [headerSaving, setHeaderSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; branchId?: string }>({})

  const [isEditingHeader, setIsEditingHeader] = useState(isCreate)
  const [header, setHeader] = useState<{
    name: string
    nameAr: string
    category: AssetCategory
    branchId: string
  }>({
    name: '',
    nameAr: '',
    category: 'FURNITURE',
    branchId: '',
  })

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lineAction, setLineAction] = useState<LineAction>(null)
  const [lineToDelete, setLineToDelete] = useState<AssetLineFormState | null>(null)
  const [lineDeleting, setLineDeleting] = useState(false)

  useDocumentTitle(
    isCreate
      ? t('assets.form.createTitle')
      : asset
        ? getInventoryLocalizedName(asset, locale)
        : undefined,
  )

  const schema = useMemo(
    () =>
      createAssetLineSchema({
        lookups: { branches },
        locale,
        t,
        handlers: {
          onMaintenanceLine: (line) => setLineAction({ kind: 'maintenance', line }),
          onDisposeLine: (line) => setLineAction({ kind: 'dispose', line }),
          onDeleteLine: setLineToDelete,
        },
      }),
    [branches, locale, t],
  )

  const loadLines = useCallback(async (): Promise<AssetLineFormState[]> => {
    if (!assetId || isCreate) return []
    return assetService.getAssetLines(assetId)
  }, [assetId, isCreate])

  const refreshAssetSummary = useCallback(async () => {
    if (!assetId || isCreate) return
    setAsset(await assetService.getAsset(assetId))
  }, [assetId, isCreate])

  const lineController = useDocumentLines<AssetLineFormState, { branches: BranchResponse[] }>({
    schema,
    initialLines,
    linesReady: !loading,
    lookups: { branches },
    locale,
    t,
    onAddLine: async (payload) => {
      await assetService.createAssetLine(numericAssetId, payload as CreateAssetLineRequest)
      const updatedLines = await loadLines()
      await refreshAssetSummary()
      return updatedLines
    },
    onUpdateLine: null,
    onDeleteLine: async (lineId) => {
      await assetService.deleteAssetLine(numericAssetId, lineId)
      const updatedLines = await loadLines()
      await refreshAssetSummary()
      return updatedLines
    },
  })

  const loadDetail = useCallback(async () => {
    if (isCreate || !assetId) return
    setLoading(true)
    setError('')
    try {
      const [assetData, lineData, branchData] = await Promise.all([
        assetService.getAsset(assetId),
        loadLines(),
        branchService.getBranches().catch(() => []),
      ])
      setAsset(assetData)
      setInitialLines(lineData)
      setBranches(branchData)
      setHeader({
        name: assetData.name,
        nameAr: assetData.nameAr ?? '',
        category: assetData.category,
        branchId: String(assetData.branchId),
      })
    } catch (err) {
      setError(translateApiError(err, t).message)
      setAsset(null)
      setInitialLines([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [assetId, isCreate, loadLines, t])

  const loadBranchesOnly = useCallback(async () => {
    try {
      const branchData = await branchService.getBranches()
      setBranches(branchData)
      const activeBranches = branchData.filter((b) => b.active)
      if (activeBranches.length === 1) {
        setHeader((prev) => ({ ...prev, branchId: String(activeBranches[0].id) }))
      }
    } catch {
      setBranches([])
    }
  }, [])

  useEffect(() => {
    if (isCreate) {
      void loadBranchesOnly()
    } else {
      void loadDetail()
    }
  }, [isCreate, loadBranchesOnly, loadDetail])

  function handleStartEditHeader() {
    if (!asset) return
    setHeader({
      name: asset.name,
      nameAr: asset.nameAr ?? '',
      category: asset.category,
      branchId: String(asset.branchId),
    })
    setFieldErrors({})
    setIsEditingHeader(true)
  }

  function handleCancelEditHeader() {
    if (isCreate) {
      navigate('/assets/list')
      return
    }
    if (asset) {
      setHeader({
        name: asset.name,
        nameAr: asset.nameAr ?? '',
        category: asset.category,
        branchId: String(asset.branchId),
      })
    }
    setFieldErrors({})
    setIsEditingHeader(false)
  }

  async function handleSaveHeader() {
    const errors: { name?: string; branchId?: string } = {}
    if (!header.name.trim()) {
      errors.name = t('common.requiredField')
    }
    if (isCreate && !header.branchId) {
      errors.branchId = t('common.requiredField')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setHeaderSaving(true)
    setError('')

    try {
      if (isCreate) {
        const created = await assetService.createAsset({
          branchId: Number(header.branchId),
          name: header.name.trim(),
          nameAr: header.nameAr.trim() || undefined,
          category: header.category,
        })
        navigate(`/assets/${created.id}`, { replace: true })
      } else if (asset) {
        const updated = await assetService.updateAsset(asset.id, {
          name: header.name.trim(),
          nameAr: header.nameAr.trim() || undefined,
          category: header.category,
        })
        setAsset(updated)
        setIsEditingHeader(false)
      }
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setHeaderSaving(false)
    }
  }

  async function handleDeleteAsset() {
    if (!assetId || isCreate) return
    setActionLoading(true)
    try {
      await assetService.deleteAsset(assetId)
      navigate('/assets/list')
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setActionLoading(false)
      setDeleteModalOpen(false)
    }
  }

  function handleStartAddLine() {
    lineController.startAddLine({
      label: '',
      quantity: '1',
      unitCost: '',
      purchaseDate: getTodayInputDate(),
      status: 'ACTIVE',
    })
  }

  async function handleSaveLine() {
    const result = await lineController.saveNewLine((form) => ({
      label: form.label?.trim() || undefined,
      quantity: form.quantity,
      unitCost: form.unitCost,
      purchaseDate: form.purchaseDate,
    }))
    if (!result.ok && result.kind === 'validation') return
  }

  async function handleDeleteLine() {
    if (!numericAssetId || !lineToDelete) return
    setLineDeleting(true)
    setError('')
    try {
      const result = await lineController.deleteLine(lineToDelete.id!)
      if (result.ok) setLineToDelete(null)
    } catch {
      // Mutation errors are translated once by the global interceptor.
    } finally {
      setLineDeleting(false)
    }
  }

  const branchName = resolveBranchName(
    asset?.branchId ?? header.branchId,
    branches,
    locale,
    asset,
  )
  const pageTitle = isCreate
    ? t('assets.form.createTitle')
    : asset
      ? getInventoryLocalizedName(asset, locale)
      : t('assets.detail.title')

  const subtitle = asset
    ? [getAssetCategoryLabel(asset.category, t), branchName]
        .filter(Boolean)
        .join(' · ')
    : undefined

  const pageActions = isCreate ? (
    <Button
      variant="primary"
      type="submit"
      disabled={headerSaving}
    >
      {headerSaving ? (
        <>
          <Loader2 size={18} className="pi-form-actions__submit-spinner" aria-hidden />
          {t('common.loading')}
        </>
      ) : (
        t('common.save')
      )}
    </Button>
  ) : isEditingHeader ? (
    <>
      <IconActionButton
        className="action-btn action-btn--icon action-btn--confirm"
        label={t('common.save')}
        onClick={() => void handleSaveHeader()}
        disabled={headerSaving}
      >
        {headerSaving ? (
          <Loader2 size={20} className="pi-form-actions__submit-spinner" aria-hidden />
        ) : (
          <Check size={20} aria-hidden />
        )}
      </IconActionButton>
      <IconActionButton
        className="action-btn action-btn--icon action-btn--cancel"
        label={t('common.cancel')}
        onClick={handleCancelEditHeader}
        disabled={headerSaving}
      >
        <X size={20} aria-hidden />
      </IconActionButton>
    </>
  ) : (
    <>
      <IconActionButton
        className="action-btn action-btn--icon action-btn--delete-danger"
        label={t('common.delete')}
        onClick={() => setDeleteModalOpen(true)}
        disabled={actionLoading || headerSaving}
      >
        <Trash2 size={18} aria-hidden />
      </IconActionButton>
      <IconActionButton
        className="action-btn action-btn--icon"
        label={t('common.edit')}
        onClick={handleStartEditHeader}
        disabled={actionLoading || headerSaving}
      >
        <Pencil size={20} aria-hidden />
      </IconActionButton>
    </>
  )

  return (
    <ListPage className="asset-detail-page">
      {error ? <div className="page-error-banner">{error}</div> : null}

      <form
        className="pi-form"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSaveHeader()
        }}
        noValidate
      >
        <DetailHeader
          title={pageTitle}
          reference={subtitle}
          statusBadge={asset ? <AssetStatusBadge status={asset.status} /> : null}
          actions={pageActions}
          backTo="/assets/list"
          backDisabled={headerSaving}
        >
          <div className="pi-form-header-grid">
            {isEditingHeader ? (
              <>
                <PiFormField label={t('assets.form.name')} required error={fieldErrors.name}>
                  <input
                    type="text"
                    className="pi-form-field__input"
                    value={header.name}
                    onChange={(e) => setHeader((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={headerSaving}
                    required
                  />
                </PiFormField>

                <PiFormField label={t('assets.form.nameAr')}>
                  <input
                    type="text"
                    className="pi-form-field__input"
                    value={header.nameAr}
                    onChange={(e) => setHeader((prev) => ({ ...prev, nameAr: e.target.value }))}
                    disabled={headerSaving}
                  />
                </PiFormField>

                <PiFormField label={t('assets.form.category')} required>
                  <select
                    className="pi-form-field__select"
                    value={header.category}
                    onChange={(e) =>
                      setHeader((prev) => ({ ...prev, category: e.target.value as AssetCategory }))
                    }
                    disabled={headerSaving}
                  >
                    {ASSET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {getAssetCategoryLabel(cat, t)}
                      </option>
                    ))}
                  </select>
                </PiFormField>

                <PiFormField label={t('assets.form.branch')} required error={fieldErrors.branchId}>
                  <select
                    className="pi-form-field__select"
                    value={header.branchId}
                    onChange={(e) => setHeader((prev) => ({ ...prev, branchId: e.target.value }))}
                    disabled={headerSaving || !isCreate}
                  >
                    <option value="">{t('assets.form.selectBranch')}</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {getLocalizedBranchName(b, locale)}
                      </option>
                    ))}
                  </select>
                </PiFormField>
              </>
            ) : asset ? (
              <>
                <DetailField
                  label={t('assets.columns.category')}
                  value={getAssetCategoryLabel(asset.category, t)}
                />
                <DetailField
                  label={t('assets.form.branch')}
                  value={branchName}
                />
                <DetailField
                  label={t('assets.columns.lineCount')}
                  value={asset.lineCount}
                />
                <DetailField
                  label={t('assets.columns.currentValue')}
                  value={formatDecimalString(asset.totalCurrentValue)}
                  dir="ltr"
                />
              </>
            ) : null}
          </div>
        </DetailHeader>
      </form>

      {loading ? (
        <div className="pi-form-lines__loading" role="status">{t('common.loading')}</div>
      ) : !isCreate ? (
        <SchemaDocumentLinesCard
          title={t('assets.lines.tableTitle')}
          schema={schema}
          lines={lineController.lines}
          lookups={{ branches }}
          viewMode={lineController.viewMode}
          selectedLineId={lineController.selectedLineId}
          selectedIndex={lineController.selectedIndex}
          locale={locale}
          t={t}
          showActions
          addingLine={lineController.addingLine}
          newLineForm={lineController.newLineForm}
          lineSaving={lineController.lineSaving}
          lineError={lineController.fieldErrors.lineError ?? lineController.newLineValidationError ?? undefined}
          interactionLocked={isEditingHeader}
          addDisabled={isEditingHeader}
          saveDisabled={Boolean(lineController.newLineValidationError)}
          renderStatusBadge={(status) => <AssetStatusBadge status={status as AssetStatus} />}
          emptyState={
            <div className="pi-form-lines__empty asset-lines-empty">
              <p className="text-muted">{t('assets.lines.empty.description')}</p>
            </div>
          }
          onFieldChange={lineController.updateFormValue}
          onSaveLine={() => void handleSaveLine()}
          onCancelLine={lineController.cancelLineAction}
          onStartAddLine={handleStartAddLine}
          onViewModeChange={lineController.setViewMode}
          onSelectLine={lineController.selectLine}
        />
      ) : null}

      <ConfirmModal
        open={deleteModalOpen}
        title={t('common.delete')}
        message={t('common.confirmDelete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmVariant="dangerConfirm"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAsset()}
      />

      <ConfirmModal
        open={Boolean(lineToDelete)}
        title={t('common.delete')}
        message={t('common.confirmDelete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmVariant="dangerConfirm"
        loading={lineDeleting}
        loadingLabel={t('common.loading')}
        onClose={() => setLineToDelete(null)}
        onConfirm={() => void handleDeleteLine()}
      />

      {asset && lineAction?.kind === 'dispose' ? (
        <AssetDisposalForm
          open
          initialAssetId={numericAssetId}
          initialLineId={Number(lineAction.line.id)}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}

      {asset && lineAction?.kind === 'maintenance' ? (
        <AssetMaintenanceForm
          open
          initialAssetId={numericAssetId}
          initialLineId={Number(lineAction.line.id)}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}
    </ListPage>
  )
}
