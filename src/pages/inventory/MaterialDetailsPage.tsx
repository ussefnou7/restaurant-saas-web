import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Loader2, X } from 'lucide-react'
import {
  EntityDetailScreen,
  EntityOverviewActions,
} from '../../components/entity-detail'
import { IconActionButton } from '../../components/ui/RowActions'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import { useUomLookup } from '../../hooks/useUomLookup'
import * as inventoryService from '../../services/inventoryService'
import type { MaterialResponse, UomResponse } from '../../types/inventory'
import { translateApiError } from '../../utils/errors'
import { canManageInventorySetup, canViewInventorySetup } from '../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import { InventoryAccessDenied } from './InventoryAccessDenied'
import { MaterialOverviewPanel } from './MaterialOverviewPanel'
import { useInventoryLookups } from './useInventoryLookups'

export function MaterialDetailsPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { materialId } = useParams<{ materialId: string }>()

  const isCreate = !materialId || materialId === 'new'
  const canView = canViewInventorySetup()
  const canManage = canManageInventorySetup()
  const { categories, loading: loadingLookups } = useInventoryLookups()
  const { activeUoms } = useUomLookup()
  const uoms = activeUoms as unknown as UomResponse[]

  const [material, setMaterial] = useState<MaterialResponse | null>(null)
  const [loading, setLoading] = useState(!isCreate)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [saving, setSaving] = useState(false)

  const initialEditRequested =
    isCreate ||
    searchParams.get('edit') === '1' ||
    searchParams.get('edit') === 'true' ||
    Boolean((location.state as { edit?: boolean } | null)?.edit) ||
    location.pathname.endsWith('/edit')

  const [isEditing, setIsEditing] = useState(initialEditRequested)

  const loadMaterial = useCallback(async () => {
    if (isCreate || !materialId) return

    setLoading(true)
    setError('')

    try {
      const found = await inventoryService.getMaterial(materialId)
      setMaterial(found)
    } catch (err) {
      setMaterial(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [isCreate, materialId, t])

  useEffect(() => {
    if (!canView) return
    if (isCreate) {
      setMaterial(null)
      setLoading(false)
      setIsEditing(true)
      return
    }

    const timer = window.setTimeout(() => void loadMaterial(), 0)
    return () => window.clearTimeout(timer)
  }, [canView, isCreate, loadMaterial])

  function handleStartEdit() {
    setIsEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    if (isCreate) {
      navigate('/inventory/materials')
      return
    }
    setIsEditing(false)
  }

  function handleSaved(saved: MaterialResponse) {
    if (isCreate) {
      notify.success(t('inventory.toast.createSuccess'))
      navigate(`/inventory/materials/${saved.id}`, { replace: true })
    } else {
      notify.success(t('inventory.toast.updateSuccess'))
      setMaterial(saved)
      setIsEditing(false)
      setError('')
    }
  }

  async function handleToggleStatus() {
    if (!material || isEditing || !canManage) return

    setStatusBusy(true)
    try {
      const updated = material.active
        ? await inventoryService.deactivateMaterial(material.id)
        : await inventoryService.activateMaterial(material.id)
      setMaterial(updated)
      notify.success(
        updated.active
          ? t('inventory.toast.activateSuccess')
          : t('inventory.toast.deactivateSuccess'),
      )
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusBusy(false)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const materialName = material ? getInventoryLocalizedName(material, locale) : ''

  const overviewActions = isEditing ? (
    <>
      <IconActionButton
        type="submit"
        form="material-overview-form"
        className="action-btn action-btn--icon action-btn--confirm"
        label={t('inventory.materials.details.actions.saveChanges')}
        disabled={saving || statusBusy}
      >
        {saving ? (
          <Loader2 size={20} className="pi-form-actions__submit-spinner" aria-hidden />
        ) : (
          <Check size={20} aria-hidden />
        )}
      </IconActionButton>
      <IconActionButton
        className="action-btn action-btn--icon action-btn--cancel"
        label={t('inventory.materials.details.actions.cancelEdit')}
        onClick={handleCancelEdit}
        disabled={saving || statusBusy}
      >
        <X size={20} aria-hidden />
      </IconActionButton>
    </>
  ) : material && canManage ? (
    <EntityOverviewActions
      editLabel={t('inventory.materials.details.actions.edit')}
      statusLabel={
        material.active
          ? t('inventory.materials.details.actions.deactivate')
          : t('inventory.materials.details.actions.activate')
      }
      active={material.active}
      statusBusy={statusBusy}
      showDelete={false}
      onEdit={handleStartEdit}
      onToggleStatus={() => void handleToggleStatus()}
    />
  ) : null

  const pageTitle = isCreate
    ? t('inventory.materials.modal.addTitle')
    : material
      ? materialName
      : undefined

  const pageSubtitle = isCreate ? t('inventory.materials.modal.addSubtitle') : undefined

  return (
    <EntityDetailScreen
      title={pageTitle}
      subtitle={pageSubtitle}
      badge={material ? <StatusBadge active={material.active} /> : undefined}
      actions={overviewActions}
      backTo="/inventory/materials"
      backLabel={t('inventory.materials.details.back')}
      loading={loading}
      loadingMessage={t('inventory.materials.loading')}
      notFound={!loading && !isCreate && !material}
      notFoundTitle={t('inventory.materials.details.notFoundTitle')}
      notFoundMessage={error || t('inventory.materials.details.notFound')}
      error={material ? error : undefined}
      overview={
        isCreate || material ? (
          <MaterialOverviewPanel
            formId="material-overview-form"
            material={material}
            categories={categories}
            uoms={uoms}
            loadingLookups={loadingLookups}
            editing={isEditing}
            saving={saving}
            onSavingChange={setSaving}
            onCancel={handleCancelEdit}
            onSaved={handleSaved}
          />
        ) : null
      }
    />
  )
}
