import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormInput } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import * as menuService from '../../services/menuService'
import * as uomService from '../../services/uomService'
import type { MaterialResponse, UomResponse } from '../../types/inventory'
import type { Product, RecipeItemWrite } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { parsePositiveNumber } from './menuNumberUtils'
import { RecipeMaterialSelect } from './RecipeMaterialSelect'

type EditableRecipeRow = {
  key: string
  materialId: string
  quantity: string
  uomId: string
}

interface RecipeBuilderModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
}

function getMaterialStockUomId(material: MaterialResponse): number | undefined {
  return material.stockUomId ?? material.defaultUomId
}

function serializeRows(rows: EditableRecipeRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      materialId: row.materialId,
      quantity: row.quantity,
      uomId: row.uomId,
    })),
  )
}

function createRow(partial?: Partial<EditableRecipeRow>): EditableRecipeRow {
  return {
    key: partial?.key ?? `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    materialId: partial?.materialId ?? '',
    quantity: partial?.quantity ?? '',
    uomId: partial?.uomId ?? '',
  }
}

export function RecipeBuilderModal({ open, product, onClose }: RecipeBuilderModalProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()

  const [rows, setRows] = useState<EditableRecipeRow[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [lookupsLoading, setLookupsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)

  const isDirty = useMemo(() => serializeRows(rows) !== savedSnapshot, [rows, savedSnapshot])

  const usedMaterialIds = useMemo(
    () =>
      rows
        .map((row) => row.materialId)
        .filter(Boolean)
        .map((id) => Number(id)),
    [rows],
  )

  const uomOptions = useMemo(
    () =>
      uoms
        .filter((uom) => uom.active)
        .map((uom) => ({
          value: String(uom.id),
          label: uom.symbol ?? uom.code ?? uom.name,
        })),
    [uoms],
  )

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true)
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

  const loadRecipe = useCallback(async () => {
    if (!product) return

    setLoading(true)
    setError('')
    try {
      const recipe = await menuService.getProductRecipe(product.id)
      const nextRows =
        recipe.length > 0
          ? recipe.map((item) =>
              createRow({
                key: `saved-${item.id}`,
                materialId: String(item.materialId),
                quantity: String(item.quantity),
                uomId: String(item.uomId),
              }),
            )
          : []
      setRows(nextRows)
      setSavedSnapshot(serializeRows(nextRows))
    } catch (err) {
      setError(translateApiError(err, t).message)
      setRows([])
      setSavedSnapshot(serializeRows([]))
    } finally {
      setLoading(false)
    }
  }, [product, t])

  useEffect(() => {
    if (!open || !product) {
      setRows([])
      setSavedSnapshot('')
      setError('')
      setFormError('')
      return
    }

    void loadLookups()
    void loadRecipe()
  }, [open, product, loadLookups, loadRecipe])

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

  async function handleSave() {
    if (!product) return

    setFormError('')
    const validationError = validateRows()
    if (validationError) {
      setFormError(validationError)
      return
    }

    const payload: RecipeItemWrite[] = rows.map((row) => ({
      materialId: Number(row.materialId),
      quantity: parsePositiveNumber(row.quantity) ?? 0,
      uomId: Number(row.uomId),
    }))

    setSaving(true)
    try {
      await menuService.replaceProductRecipe(product.id, payload)
      notify.success(t('menu.recipe.toast.saveSuccess'))
      setSavedSnapshot(serializeRows(rows))
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        open={open}
        size="large"
        className="recipe-builder-modal"
        title={t('menu.recipe.title')}
        subtitle={product ? t('menu.recipe.subtitle', { name: product.name }) : undefined}
        onClose={requestClose}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void handleSave()} disabled={saving || loading}>
              {saving ? t('branches.actions.saving') : t('menu.recipe.save')}
            </Button>
          </>
        }
      >
        {error ? <div className="page-error-banner">{error}</div> : null}
        {formError ? <div className="alert-error">{formError}</div> : null}
        {isDirty ? <div className="recipe-builder-modal__dirty">{t('menu.recipe.unsavedChanges')}</div> : null}

        {loading || lookupsLoading ? (
          <LoadingRows columns={3} rows={4} />
        ) : (
          <>
            <div className="recipe-builder-modal__toolbar">
              <Button variant="secondary" size="sm" onClick={addRow} disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                {t('menu.recipe.addIngredient')}
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="recipe-builder-modal__empty">{t('menu.recipe.empty')}</p>
            ) : (
              <div className="recipe-builder-modal__table-wrap">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <Th>{t('menu.recipe.col.material')}</Th>
                      <Th>{t('menu.recipe.col.quantity')}</Th>
                      <Th>{t('menu.recipe.col.uom')}</Th>
                      <Th>{t('menu.col.actions')}</Th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => {
                      const excludeIds = usedMaterialIds.filter(
                        (id) => id !== Number(row.materialId),
                      )

                      return (
                        <TableRow key={row.key}>
                          <Td>
                            <RecipeMaterialSelect
                              value={row.materialId}
                              onChange={(materialId) => updateRow(row.key, { materialId })}
                              materials={materials}
                              excludeMaterialIds={excludeIds}
                              locale={locale}
                              disabled={saving}
                              placeholder={t('menu.recipe.selectMaterial')}
                              searchPlaceholder={t('common.search')}
                              ariaLabel={t('menu.recipe.selectMaterial')}
                            />
                          </Td>
                          <Td>
                            <FormInput
                              type="number"
                              ltr
                              min={0}
                              step="0.0001"
                              value={row.quantity}
                              onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                              disabled={saving}
                              aria-label={t('menu.recipe.col.quantity')}
                            />
                          </Td>
                          <Td>
                            <SelectFilter
                              value={row.uomId}
                              onChange={(uomId) => updateRow(row.key, { uomId })}
                              options={uomOptions}
                              ariaLabel={t('menu.recipe.col.uom')}
                              disabled={saving || uomOptions.length === 0}
                            />
                          </Td>
                          <Td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(row.key)}
                              disabled={saving}
                              aria-label={t('menu.recipe.removeIngredient')}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </Button>
                          </Td>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </DataTable>
              </div>
            )}

            {rows.length > 0 ? (
              <p className="recipe-builder-modal__hint text-muted text-sm">
                {t('menu.recipe.replaceHint')}
              </p>
            ) : null}
          </>
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
    </>
  )
}
