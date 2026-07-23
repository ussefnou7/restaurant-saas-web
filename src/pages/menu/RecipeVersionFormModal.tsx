import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import * as menuService from '../../services/menuService'
import * as uomService from '../../services/uomService'
import type { MaterialResponse, UomResponse } from '../../types/inventory'
import type { Product, RecipeItemRequest, RecipeItemView } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { parsePositiveNumber } from './menuNumberUtils'
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor'
import {
  createRow,
  getMaterialStockUomId,
  rowsFromRecipeItems,
  serializeRows,
  type EditableRecipeRow,
} from './recipeFormUtils'

interface RecipeVersionFormModalProps {
  open: boolean
  product: Product | null
  initialItems: RecipeItemView[]
  isFirstVersion: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RecipeVersionFormModal({
  open,
  product,
  initialItems,
  isFirstVersion,
  onClose,
  onSuccess,
}: RecipeVersionFormModalProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()

  const [rows, setRows] = useState<EditableRecipeRow[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isDirty = useMemo(() => serializeRows(rows) !== savedSnapshot, [rows, savedSnapshot])

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
    setError('')
    try {
      const [materialList, uomList] = await Promise.all([
        inventoryService.getMaterials({ active: true }),
        uomService.getTenantUoms(),
      ])
      setMaterials(materialList)
      setUoms(uomList)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLookupsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!open || !product) {
      // Recipe rows are modal draft state and reset when the modal closes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows([])
      setSavedSnapshot('')
      setError('')
      setFormError('')
      setConfirmOpen(false)
      return
    }

    const nextRows = rowsFromRecipeItems(initialItems)
    setRows(nextRows)
    setSavedSnapshot(serializeRows(nextRows))
    void loadLookups()
  }, [open, product, initialItems, loadLookups])

  function requestClose() {
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    onClose()
  }

  function updateRow(key: string, patch: Partial<EditableRecipeRow>) {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row
        const next = { ...row, ...patch }
        if (patch.materialId && patch.materialId !== row.materialId) {
          const material = materials.find((item) => String(item.id) === patch.materialId)
          const defaultUomId = material ? getMaterialStockUomId(material) : undefined
          next.uomId = defaultUomId ? String(defaultUomId) : ''
        }
        return next
      }),
    )
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  function addRow() {
    setRows((current) => [...current, createRow()])
  }

  function validateRows(): string | null {
    if (rows.length === 0) return null

    const seenMaterials = new Set<number>()
    for (const row of rows) {
      if (!row.materialId) return t('menu.recipe.validation.materialRequired')
      const materialId = Number(row.materialId)
      if (seenMaterials.has(materialId)) return t('menu.recipe.validation.duplicateMaterial')
      seenMaterials.add(materialId)

      const quantity = parsePositiveNumber(row.quantity)
      if (quantity === null) return t('menu.recipe.validation.quantityInvalid')
      if (!row.uomId) return t('menu.recipe.validation.uomRequired')
    }
    return null
  }

  function requestSubmit() {
    setFormError('')
    const validationError = validateRows()
    if (validationError) {
      setFormError(validationError)
      return
    }
    setConfirmOpen(true)
  }

  async function handleSubmit() {
    if (!product) return

    const payload: RecipeItemRequest[] = rows.map((row) => ({
      materialId: Number(row.materialId),
      quantity: parsePositiveNumber(row.quantity) ?? 0,
      uomId: Number(row.uomId),
    }))

    setSaving(true)
    try {
      await menuService.createProductRecipe(product.id, payload)
      notify.success(t('menu.recipe.toast.createSuccess'))
      setConfirmOpen(false)
      onSuccess()
      onClose()
    } catch {
      setConfirmOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const title = isFirstVersion
    ? t('menu.recipe.form.title.create')
    : t('menu.recipe.form.title.newVersion')

  return (
    <>
      <Modal
        open={open}
        size="large"
        className="recipe-builder-modal"
        title={title}
        subtitle={product ? t('menu.recipe.subtitle', { name: product.name }) : undefined}
        onClose={requestClose}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={requestSubmit}
              disabled={saving || lookupsLoading}
            >
              {saving ? t('branches.actions.saving') : t('menu.recipe.form.submit')}
            </Button>
          </>
        }
      >
        {error ? <div className="page-error-banner">{error}</div> : null}
        {formError ? <div className="alert-error">{formError}</div> : null}
        {!isFirstVersion ? (
          <div className="recipe-builder-modal__version-note">{t('menu.recipe.versioningNote')}</div>
        ) : null}
        {isDirty ? <div className="recipe-builder-modal__dirty">{t('menu.recipe.unsavedChanges')}</div> : null}

        {lookupsLoading ? (
          <LoadingRows columns={3} rows={4} />
        ) : (
          <RecipeIngredientsEditor
            rows={rows}
            materials={materials}
            uoms={uoms}
            locale={locale}
            disabled={saving}
            onAdd={addRow}
            onRemove={removeRow}
            onChange={updateRow}
          />
        )}
      </Modal>

      <ConfirmModal
        open={discardOpen}
        title={t('menu.recipe.discardConfirm.title')}
        message={t('menu.recipe.discardConfirm.message')}
        confirmLabel={t('menu.recipe.discardConfirm.confirm')}
        confirmVariant="dangerConfirm"
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false)
          onClose()
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title={t('menu.recipe.confirm.title')}
        message={t('menu.recipe.confirm.message')}
        confirmLabel={t('menu.recipe.confirm.confirm')}
        confirmVariant="primary"
        loading={saving}
        loadingLabel={t('branches.actions.saving')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleSubmit()}
      />
    </>
  )
}
