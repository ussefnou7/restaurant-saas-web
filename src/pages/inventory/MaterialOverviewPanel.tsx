import { useMemo, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionGroup,
} from '../../components/fields'
import {
  EntityOverviewPanel,
  type EntityOverviewPanelProps,
} from '../../components/entity-detail/EntityOverviewPanel'
import { Badge } from '../../components/ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import * as inventoryService from '../../services/inventoryService'
import type {
  MaterialCategoryResponse,
  MaterialResponse,
  UomResponse,
} from '../../types/inventory'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'
import {
  getDisplayUomLabel,
  getStockUomLabel,
  resolveDisplayUomId,
  resolveStockUomId,
} from '../../utils/inventoryUom'

type EditForm = {
  name: string
  nameAr: string
  categoryId: string
  stockUomId: string
  displayUomId: string
  active: boolean
  notes: string
}

function buildSelectableUoms(uoms: UomResponse[], currentIds: number[]): UomResponse[] {
  const active = uoms.filter((uom) => uom.active)
  const extras = currentIds
    .map((id) => uoms.find((uom) => uom.id === id))
    .filter(
      (uom): uom is UomResponse =>
        uom != null && !active.some((activeUom) => activeUom.id === uom.id),
    )

  return [...extras, ...active]
}

function formFromMaterial(material: MaterialResponse | null): EditForm {
  if (!material) {
    return {
      name: '',
      nameAr: '',
      categoryId: '',
      stockUomId: '',
      displayUomId: '',
      active: true,
      notes: '',
    }
  }

  return {
    name: material.name,
    nameAr: material.nameAr ?? '',
    categoryId: material.categoryId != null ? String(material.categoryId) : '',
    stockUomId: String(resolveStockUomId(material) || ''),
    displayUomId: String(resolveDisplayUomId(material) || ''),
    active: material.active,
    notes: material.notes ?? '',
  }
}

interface MaterialOverviewPanelProps
  extends Pick<EntityOverviewPanelProps, 'editing' | 'onCancel' | 'toolbarActions'> {
  material: MaterialResponse | null
  categories: MaterialCategoryResponse[]
  uoms: UomResponse[]
  loadingLookups?: boolean
  onSaved: (material: MaterialResponse) => void
}

export function MaterialOverviewPanel({
  material,
  categories,
  uoms,
  loadingLookups = false,
  editing,
  onCancel,
  onSaved,
  toolbarActions,
}: MaterialOverviewPanelProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<EditForm>(() => formFromMaterial(material))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  // React pattern: Adjust state when props change
  const [prevMaterial, setPrevMaterial] = useState(material)
  const [prevEditing, setPrevEditing] = useState(editing)
  if (prevMaterial !== material || prevEditing !== editing) {
    setPrevMaterial(material)
    setPrevEditing(editing)
    if (!editing || prevMaterial?.id !== material?.id) {
      setForm(formFromMaterial(material))
      setSaveError('')
    }
  }

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('inventory.common.selectCategory') },
      ...categories
        .filter((c) => c.active || (material && c.id === material.categoryId))
        .map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories, material, t],
  )

  const uomOptions = useMemo(() => {
    const currentIds = material
      ? [resolveStockUomId(material), resolveDisplayUomId(material)]
      : []
    const selectable = buildSelectableUoms(uoms, currentIds)
    const emptyLabel = loadingLookups
      ? t('common.loading')
      : t('inventory.common.selectUom')

    return [
      { value: '', label: emptyLabel },
      ...selectable.map((u) => ({
        value: String(u.id),
        label: getInventoryLocalizedName(u, locale),
      })),
    ]
  }, [loadingLookups, locale, material, t, uoms])

  function validate(): string | null {
    if (!form.name.trim()) return t('inventory.materials.validation.nameRequired')
    if (!form.categoryId) return t('inventory.materials.validation.categoryRequired')
    if (!form.stockUomId) return t('inventory.materials.validation.stockUomRequired')
    if (!form.displayUomId) return t('inventory.materials.validation.displayUomRequired')
    return null
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaveError('')

    const validationError = validate()
    if (validationError) {
      setSaveError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        categoryId: Number(form.categoryId),
        stockUomId: Number(form.stockUomId),
        displayUomId: Number(form.displayUomId),
        active: form.active,
        notes: form.notes.trim() || null,
      }

      if (material) {
        const updated = await inventoryService.updateMaterial(material.id, payload)
        onSaved(updated)
      } else {
        const created = await inventoryService.createMaterial(payload)
        onSaved(created)
      }
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const emptyDash = t('common.empty.dash')
  const disabled = saving || loadingLookups
  const statusActive = editing ? form.active : (material?.active ?? true)
  const isCreate = material == null

  function renderFields() {
    if (!editing && material) {
      const source = material.catalogId
        ? t('inventory.common.catalog')
        : t('inventory.common.custom')

      return (
        <FieldGrid columns={3}>
          <DetailField label={t('inventory.col.code')} value={material.code} dir="ltr" />
          <DetailField
            label={t('inventory.col.name')}
            value={getInventoryLocalizedName(material, locale)}
          />
          <DetailField
            label={t('inventory.col.nameAr')}
            value={displayArabicName(material.nameAr, emptyDash)}
            empty={!material.nameAr?.trim()}
            emptyValue={emptyDash}
            dir="rtl"
          />
          <DetailField
            label={t('inventory.col.category')}
            value={material.categoryName ?? emptyDash}
          />
          <DetailField
            label={t('inventory.col.stockUom')}
            value={getStockUomLabel(material, locale, uoms)}
          />
          <DetailField
            label={t('inventory.col.displayUom')}
            value={getDisplayUomLabel(material, locale, uoms)}
          />
          <DetailField
            label={t('inventory.col.source')}
            value={
              <Badge variant={material.catalogId ? 'muted' : 'success'}>
                {source}
              </Badge>
            }
          />
          <DetailField
            label={t('inventory.materials.fields.notes')}
            value={material.notes?.trim() || emptyDash}
            empty={!material.notes?.trim()}
            emptyValue={emptyDash}
            fullWidth
          />
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        {!isCreate && material ? (
          <FormField label={t('inventory.col.code')}>
            <span className="field-box__value field-box__value--ltr" dir="ltr">
              {material.code}
            </span>
          </FormField>
        ) : null}
        <FormField label={t('inventory.col.name')} htmlFor="material-overview-name">
          <FormInput
            id="material-overview-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            disabled={disabled}
            required
          />
        </FormField>
        <FormField label={t('inventory.fields.nameAr')} htmlFor="material-overview-name-ar">
          <FormInput
            id="material-overview-name-ar"
            dir="rtl"
            value={form.nameAr}
            onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
            placeholder={t('inventory.fields.nameArPlaceholder')}
            disabled={disabled}
          />
        </FormField>
        <FormField label={t('inventory.col.category')}>
          <FormSelect
            value={form.categoryId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            disabled={disabled}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label={t('inventory.col.stockUom')}>
          <FormSelect
            value={form.stockUomId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, stockUomId: event.target.value }))
            }
            disabled={disabled}
          >
            {uomOptions.map((opt) => (
              <option key={`stock-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
          <p className="form-hint">{t('inventory.col.stockUomHint')}</p>
        </FormField>
        <FormField label={t('inventory.col.displayUom')}>
          <FormSelect
            value={form.displayUomId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, displayUomId: event.target.value }))
            }
            disabled={disabled}
          >
            {uomOptions.map((opt) => (
              <option key={`display-${opt.value}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormSelect>
          <p className="form-hint">{t('inventory.col.displayUomHint')}</p>
        </FormField>
        <FormField
          label={t('inventory.materials.fields.notes')}
          htmlFor="material-overview-notes"
          fullWidth
        >
          <FormTextarea
            id="material-overview-notes"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            rows={3}
            disabled={disabled}
          />
        </FormField>
      </FieldGrid>
    )
  }

  return (
    <EntityOverviewPanel
      title={t('inventory.materials.overview.title')}
      active={statusActive}
      editing={editing}
      saving={disabled}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={(event) => void handleSave(event)}
      toolbarActions={toolbarActions}
      onActiveChange={(active) => setForm((prev) => ({ ...prev, active }))}
      createdAt={material?.createdAt}
      updatedAt={material?.updatedAt}
      createdAtLabel={t('inventory.materials.fields.createdAt')}
      updatedAtLabel={t('inventory.materials.fields.updatedAt')}
      cancelLabel={t('inventory.materials.details.actions.cancelEdit')}
      saveLabel={t('inventory.materials.details.actions.saveChanges')}
      savingLabel={t('inventory.materials.details.actions.saving')}
    >
      <SectionGroup title={t('inventory.materials.sections.details')} divider={false}>
        {renderFields()}
      </SectionGroup>
    </EntityOverviewPanel>
  )
}
