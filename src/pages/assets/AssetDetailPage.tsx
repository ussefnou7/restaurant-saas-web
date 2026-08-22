import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Plus, Trash2, Wrench, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DetailField } from '../../components/fields'
import { DocumentHeader, DocumentLinesCard } from '../../components/layout/DocumentLayout'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { ListPage } from '../../components/ui/ListPage'
import { IconActionButton } from '../../components/ui/RowActions'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as assetService from '../../services/assetService'
import * as branchService from '../../services/branchService'
import type { AssetCategory, AssetLineResponse, AssetResponse } from '../../types/assets'
import type { BranchResponse } from '../../types/branch'
import {
  formatAssetLineLabel,
  formatDecimalString,
  getAssetCategoryLabel,
} from '../../utils/assetDisplay'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDate } from '../../utils/format'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { AssetStatusBadge } from './AssetBadges'
import { AssetDisposalForm, AssetMaintenanceForm } from './AssetOperationForms'

type LineAction =
  | { kind: 'dispose'; line: AssetLineResponse }
  | { kind: 'maintenance'; line: AssetLineResponse }
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
  const [lines, setLines] = useState<AssetLineResponse[]>([])
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

  // Inline Line Creation State
  const [addingLine, setAddingLine] = useState(false)
  const [lineForm, setLineForm] = useState({
    label: '',
    quantity: '1',
    unitCost: '',
    purchaseDate: getTodayInputDate(),
  })
  const [lineSaving, setLineSaving] = useState(false)
  const [lineError, setLineError] = useState('')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [lineAction, setLineAction] = useState<LineAction>(null)

  const loadDetail = useCallback(async () => {
    if (isCreate) return
    setLoading(true)
    setError('')
    try {
      const [assetData, lineData, branchData] = await Promise.all([
        assetService.getAsset(assetId!),
        assetService.getAssetLines(assetId!),
        branchService.getBranches().catch(() => []),
      ])
      setAsset(assetData)
      setLines(lineData)
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
      setLines([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [assetId, isCreate, t])

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
      errors.name = t('common.requiredField', { defaultValue: 'هذا الحقل مطلوب' })
    }
    if (isCreate && !header.branchId) {
      errors.branchId = t('common.requiredField', { defaultValue: 'هذا الحقل مطلوب' })
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
    setLineForm({
      label: '',
      quantity: '1',
      unitCost: '',
      purchaseDate: getTodayInputDate(),
    })
    setLineError('')
    setAddingLine(true)
  }

  async function handleSaveLine() {
    if (!numericAssetId || !lineForm.quantity || !lineForm.unitCost || !lineForm.purchaseDate) return
    setLineSaving(true)
    setLineError('')
    try {
      await assetService.createAssetLine(numericAssetId, {
        label: lineForm.label.trim() || undefined,
        quantity: lineForm.quantity,
        unitCost: lineForm.unitCost,
        purchaseDate: lineForm.purchaseDate,
      })
      setAddingLine(false)
      await loadDetail()
    } catch (err) {
      setLineError(translateApiError(err, t).message)
    } finally {
      setLineSaving(false)
    }
  }

  const currentBranch = asset
    ? branches.find((b) => b.id === asset.branchId)
    : branches.find((b) => String(b.id) === header.branchId)
  const branchName = currentBranch ? getLocalizedBranchName(currentBranch, locale) : '—'
  const pageTitle = isCreate
    ? t('assets.form.createTitle')
    : asset
      ? getInventoryLocalizedName(asset, locale)
      : t('assets.detail.title')

  const showEmpty = !loading && !error && lines.length === 0
  const showTable = !loading && !error && lines.length > 0

  return (
    <ListPage className="purchase-invoice-form-page purchase-invoice-form-page--redesign asset-detail-page">
      {error ? <div className="page-error-banner">{error}</div> : null}

      <form
        className="pi-form"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSaveHeader()
        }}
        dir="rtl"
        noValidate
      >
        <DocumentHeader
          title={pageTitle}
          statusBadge={asset ? <AssetStatusBadge status={asset.status} /> : null}
          actions={
            isCreate ? (
              <>
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

                <span className="pi-form-topbar__actions-divider" aria-hidden="true" />

                <IconActionButton
                  className="action-btn action-btn--icon action-btn--header-back"
                  label={t('assets.actions.back')}
                  onClick={() => navigate('/assets/list')}
                  disabled={headerSaving}
                >
                  {locale === 'ar' ? <ArrowRight size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
                </IconActionButton>
              </>
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
                    <Check size={20} aria-hidden="true" />
                  )}
                </IconActionButton>

                <IconActionButton
                  className="action-btn action-btn--icon action-btn--cancel"
                  label={t('common.cancel')}
                  onClick={handleCancelEditHeader}
                  disabled={headerSaving}
                >
                  <X size={20} aria-hidden="true" />
                </IconActionButton>

                <span className="pi-form-topbar__actions-divider" aria-hidden="true" />

                <IconActionButton
                  className="action-btn action-btn--icon action-btn--header-back"
                  label={t('assets.actions.back')}
                  onClick={() => navigate('/assets/list')}
                  disabled={headerSaving}
                >
                  {locale === 'ar' ? <ArrowRight size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
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
                  <Trash2 size={18} aria-hidden="true" />
                </IconActionButton>

                <IconActionButton
                  className="action-btn action-btn--icon"
                  label={t('common.edit')}
                  onClick={handleStartEditHeader}
                  disabled={actionLoading || headerSaving}
                >
                  <Pencil size={20} aria-hidden="true" />
                </IconActionButton>

                <span className="pi-form-topbar__actions-divider" aria-hidden="true" />

                <IconActionButton
                  className="action-btn action-btn--icon action-btn--header-back"
                  label={t('assets.actions.back')}
                  onClick={() => navigate('/assets/list')}
                  disabled={actionLoading || headerSaving}
                >
                  {locale === 'ar' ? <ArrowRight size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
                </IconActionButton>
              </>
            )
          }
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
                  value={`${formatDecimalString(asset.totalCurrentValue)} ج.م`}
                  dir="ltr"
                />
              </>
            ) : null}
          </div>
        </DocumentHeader>
      </form>

      <DocumentLinesCard
        title={t('assets.lines.tableTitle')}
        actions={
          !isCreate ? (
            <Button onClick={handleStartAddLine} disabled={!asset || actionLoading || isEditingHeader || addingLine}>
              <Plus size={16} aria-hidden="true" />
              {t('assets.lines.add')}
            </Button>
          ) : null
        }
      >
        {lineError ? <div className="form-error-banner" style={{ margin: '12px 16px' }}>{lineError}</div> : null}

        {isCreate ? (
          <div className="pi-form-lines__empty" style={{ padding: '24px', textAlign: 'center' }}>
            <p className="text-muted">{t('assets.lines.empty.description')}</p>
          </div>
        ) : showEmpty && !addingLine ? (
          <div className="pi-form-lines__empty" style={{ padding: '24px', textAlign: 'center' }}>
            <p className="text-muted">{t('assets.lines.empty.description')}</p>
          </div>
        ) : (
          <DataTable className="pi-form-lines-table asset-lines-table">
            <TableHead>
              <TableRow>
                <Th className="asset-lines-col--label">{t('assets.lines.label')}</Th>
                <Th className="table-cell--numeric asset-lines-col--qty">{t('assets.lines.quantity')}</Th>
                <Th className="table-cell--numeric asset-lines-col--rem">{t('assets.lines.remainingQuantity')}</Th>
                <Th className="table-cell--numeric asset-lines-col--cost">{t('assets.lines.unitCost')}</Th>
                <Th column="date" className="asset-lines-col--date">{t('assets.lines.purchaseDate')}</Th>
                <Th column="status">{t('common.status')}</Th>
                <Th column="actions">{t('assets.columns.actions')}</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {addingLine ? (
                <TableRow className="pi-form-lines-table__row--edit">
                  <Td className="asset-lines-col--label">
                    <textarea
                      className="pi-form-line-row__input pi-form-line-row__textarea"
                      value={lineForm.label}
                      onChange={(e) => setLineForm((prev) => ({ ...prev, label: e.target.value }))}
                      placeholder={t('assets.lines.label')}
                      disabled={lineSaving}
                      rows={1}
                      autoFocus
                    />
                  </Td>
                  <Td className="table-cell--numeric asset-lines-col--qty">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="pi-form-line-row__input pi-form-line-row__input--ltr"
                      value={lineForm.quantity}
                      onChange={(e) => setLineForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      disabled={lineSaving}
                    />
                  </Td>
                  <Td className="table-cell--numeric asset-lines-col--rem text-muted" dir="ltr">
                    {formatDecimalString(lineForm.quantity) || '—'}
                  </Td>
                  <Td className="table-cell--numeric asset-lines-col--cost">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="pi-form-line-row__input pi-form-line-row__input--ltr"
                      value={lineForm.unitCost}
                      onChange={(e) => setLineForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                      placeholder="0.00"
                      disabled={lineSaving}
                    />
                  </Td>
                  <Td column="date" className="asset-lines-col--date">
                    <input
                      type="date"
                      className="pi-form-line-row__input"
                      value={lineForm.purchaseDate}
                      onChange={(e) => setLineForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                      disabled={lineSaving}
                    />
                  </Td>
                  <Td column="status">
                    <span className="text-muted">—</span>
                  </Td>
                  <Td column="actions">
                    <div className="pi-form-lines-table__row-actions">
                      <IconActionButton
                        className="action-btn action-btn--icon action-btn--confirm"
                        label={t('common.save')}
                        onClick={() => void handleSaveLine()}
                        disabled={lineSaving || !lineForm.quantity || !lineForm.unitCost || !lineForm.purchaseDate}
                      >
                        {lineSaving ? (
                          <Loader2 size={16} className="pi-form-actions__submit-spinner" aria-hidden />
                        ) : (
                          <Check size={16} aria-hidden />
                        )}
                      </IconActionButton>
                      <IconActionButton
                        className="action-btn action-btn--icon action-btn--cancel"
                        label={t('common.cancel')}
                        onClick={() => setAddingLine(false)}
                        disabled={lineSaving}
                      >
                        <X size={16} aria-hidden />
                      </IconActionButton>
                    </div>
                  </Td>
                </TableRow>
              ) : null}

              {lines.map((line) => (
                <TableRow key={line.id} className="asset-line-row">
                  <Td className="asset-lines-col--label">{formatAssetLineLabel(line.label, line.id, t)}</Td>
                  <Td dir="ltr" className="table-cell--numeric asset-lines-col--qty">{formatDecimalString(line.quantity)}</Td>
                  <Td dir="ltr" className="table-cell--numeric asset-lines-col--rem">{formatDecimalString(line.remainingQuantity)}</Td>
                  <Td dir="ltr" className="table-cell--numeric asset-lines-col--cost">{formatDecimalString(line.unitCost)}</Td>
                  <Td column="date" className="asset-lines-col--date">{formatDate(line.purchaseDate)}</Td>
                  <Td column="status"><AssetStatusBadge status={line.status} /></Td>
                  <StopPropagationCell className="asset-line-row__actions">
                    <Button size="sm" variant="secondary" onClick={() => setLineAction({ kind: 'dispose', line })}>
                      <Trash2 size={16} aria-hidden="true" />
                      {t('assets.disposal.action')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setLineAction({ kind: 'maintenance', line })}>
                      <Wrench size={16} aria-hidden="true" />
                      {t('assets.maintenance.action')}
                    </Button>
                  </StopPropagationCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}
      </DocumentLinesCard>

      <ConfirmModal
        open={deleteModalOpen}
        title={t('common.delete')}
        message={t('common.confirmDelete', { defaultValue: 'هل أنت تأكد من رغبتك في حذف هذا الأصل؟' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        confirmVariant="dangerConfirm"
        loading={actionLoading}
        loadingLabel={t('common.loading')}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => void handleDeleteAsset()}
      />

      {asset && lineAction?.kind === 'dispose' ? (
        <AssetDisposalForm
          open
          initialAssetId={numericAssetId}
          initialLineId={lineAction.line.id}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}

      {asset && lineAction?.kind === 'maintenance' ? (
        <AssetMaintenanceForm
          open
          initialAssetId={numericAssetId}
          initialLineId={lineAction.line.id}
          onClose={() => setLineAction(null)}
          onSaved={() => void loadDetail()}
        />
      ) : null}
    </ListPage>
  )
}
