import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  DetailField,
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  SectionGroup,
  formDropdownClassName,
} from '../../components/fields'
import {
  EntityOverviewPanel,
  type EntityOverviewPanelProps,
} from '../../components/entity-detail/EntityOverviewPanel'
import { Dropdown } from '../../components/ui/Dropdown'
import type { TranslationKey } from '../../i18n/types'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as inventoryService from '../../services/inventoryService'
import type { BranchResponse } from '../../types/branch'
import type { WarehouseResponse, WarehouseType } from '../../types/inventory'
import { buildBranchOptions, getLocalizedBranchName } from '../../utils/branchDisplay'
import { displayArabicName, getInventoryLocalizedName } from '../../utils/inventoryDisplay'

const WAREHOUSE_TYPES: WarehouseType[] = [
  'CENTRAL',
  'BRANCH',
  'KITCHEN',
  'FREEZER',
  'BAR',
  'OTHER',
]

type EditForm = {
  name: string
  nameAr: string
  type: WarehouseType
  branchId: string
  active: boolean
  notes: string
}

function formFromWarehouse(warehouse: WarehouseResponse): EditForm {
  return {
    name: warehouse.name,
    nameAr: warehouse.nameAr ?? '',
    type: warehouse.type,
    branchId: warehouse.branchId != null ? String(warehouse.branchId) : '',
    active: warehouse.active,
    notes: warehouse.notes ?? '',
  }
}

interface WarehouseOverviewPanelProps
  extends Pick<EntityOverviewPanelProps, 'editing' | 'onCancel' | 'toolbarActions'> {
  warehouse: WarehouseResponse
  branches: BranchResponse[]
  onSaved: (warehouse: WarehouseResponse) => void
}

export function WarehouseOverviewPanel({
  warehouse,
  branches,
  editing,
  onCancel,
  onSaved,
  toolbarActions,
}: WarehouseOverviewPanelProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState<EditForm>(() => formFromWarehouse(warehouse))
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchOptions, setBranchOptions] = useState<BranchResponse[]>(branches)

  const typeLabel = t(`inventory.warehouses.types.${warehouse.type}` as TranslationKey)
  const branchLabel = useMemo(() => {
    if (warehouse.branchName) return warehouse.branchName
    if (warehouse.branchId) {
      const branch = branchOptions.find((item) => item.id === warehouse.branchId)
      if (branch) return getLocalizedBranchName(branch, locale)
    }
    return t('common.empty.dash')
  }, [branchOptions, locale, t, warehouse.branchId, warehouse.branchName])

  useEffect(() => {
    if (!editing) {
      setForm(formFromWarehouse(warehouse))
      setSaveError('')
    }
  }, [warehouse, editing])

  useEffect(() => {
    if (!editing) return

    let cancelled = false

    async function loadBranches() {
      setLoadingBranches(true)
      try {
        const data = await branchService.getBranches()
        if (!cancelled) {
          setBranchOptions(data)
        }
      } catch {
        if (!cancelled) {
          setBranchOptions(branches)
        }
      } finally {
        if (!cancelled) {
          setLoadingBranches(false)
        }
      }
    }

    void loadBranches()
    return () => {
      cancelled = true
    }
  }, [branches, editing])

  const typeOptions = useMemo(
    () =>
      WAREHOUSE_TYPES.map((type) => ({
        value: type,
        label: t(`inventory.warehouses.types.${type}` as TranslationKey),
      })),
    [t],
  )

  const branchDropdownOptions = useMemo(() => {
    const selectable = buildBranchOptions(branchOptions, warehouse.branchId ?? null)
    return [
      { value: '', label: t('inventory.common.selectBranch') },
      ...selectable.map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    ]
  }, [branchOptions, locale, t, warehouse.branchId])

  function validate(): string | null {
    if (!form.name.trim()) return t('inventory.warehouses.validation.nameRequired')
    if (!form.type) return t('inventory.warehouses.validation.typeRequired')
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
      const updated = await inventoryService.updateWarehouse(warehouse.id, {
        code: warehouse.code,
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
        type: form.type,
        branchId: form.branchId ? Number(form.branchId) : null,
        active: form.active,
        notes: form.notes.trim() || null,
      })
      onSaved(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const emptyDash = t('common.empty.dash')
  const disabled = saving || loadingBranches
  const statusActive = editing ? form.active : warehouse.active

  function renderFields() {
    if (!editing) {
      return (
        <FieldGrid columns={3}>
          <DetailField label={t('inventory.col.code')} value={warehouse.code} dir="ltr" />
          <DetailField
            label={t('inventory.col.name')}
            value={getInventoryLocalizedName(warehouse, locale)}
          />
          <DetailField
            label={t('inventory.col.nameAr')}
            value={displayArabicName(warehouse.nameAr, emptyDash)}
            empty={!warehouse.nameAr?.trim()}
            emptyValue={emptyDash}
            dir="rtl"
          />
          <DetailField label={t('inventory.col.type')} value={typeLabel} />
          <DetailField label={t('inventory.col.branch')} value={branchLabel} />
          <DetailField
            label={t('inventory.warehouses.fields.notes')}
            value={warehouse.notes?.trim() || emptyDash}
            empty={!warehouse.notes?.trim()}
            emptyValue={emptyDash}
            fullWidth
          />
        </FieldGrid>
      )
    }

    return (
      <FieldGrid columns={3}>
        <FormField label={t('inventory.col.code')}>
          <FormInput type="text" ltr value={warehouse.code} readOnly disabled />
        </FormField>
        <FormField label={t('inventory.col.name')} htmlFor="warehouse-overview-name">
          <FormInput
            id="warehouse-overview-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            disabled={disabled}
            required
          />
        </FormField>
        <FormField label={t('inventory.fields.nameAr')} htmlFor="warehouse-overview-name-ar">
          <FormInput
            id="warehouse-overview-name-ar"
            dir="rtl"
            value={form.nameAr}
            onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
            placeholder={t('inventory.fields.nameArPlaceholder')}
            disabled={disabled}
          />
        </FormField>
        <FormField label={t('inventory.col.type')}>
          <FormSelect
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value as WarehouseType }))
            }
            disabled={disabled}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label={t('inventory.col.branch')}>
          <Dropdown
            value={form.branchId}
            onChange={(branchId) => setForm((prev) => ({ ...prev, branchId }))}
            options={branchDropdownOptions}
            ariaLabel={t('inventory.col.branch')}
            className={formDropdownClassName()}
            disabled={disabled}
          />
        </FormField>
        <FormField
          label={t('inventory.warehouses.fields.notes')}
          htmlFor="warehouse-overview-notes"
          fullWidth
        >
          <FormTextarea
            id="warehouse-overview-notes"
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
      title={t('inventory.warehouses.overview.title')}
      active={statusActive}
      editing={editing}
      saving={disabled}
      saveError={saveError}
      onCancel={onCancel}
      onSubmit={(event) => void handleSave(event)}
      toolbarActions={toolbarActions}
      onActiveChange={(active) => setForm((prev) => ({ ...prev, active }))}
      createdAt={warehouse.createdAt}
      updatedAt={warehouse.updatedAt}
      createdAtLabel={t('inventory.warehouses.fields.createdAt')}
      updatedAtLabel={t('inventory.warehouses.fields.updatedAt')}
      cancelLabel={t('inventory.warehouses.details.actions.cancelEdit')}
      saveLabel={t('inventory.warehouses.details.actions.saveChanges')}
      savingLabel={t('inventory.warehouses.details.actions.saving')}
    >
      <SectionGroup title={t('inventory.warehouses.sections.details')} divider={false}>
        {renderFields()}
      </SectionGroup>
    </EntityOverviewPanel>
  )
}
