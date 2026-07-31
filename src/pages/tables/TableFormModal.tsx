import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FieldGrid,
  FormField,
  FormInput,
  FormSelect,
  StatusSwitch,
} from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as tableSectionService from '../../services/tableSectionService'
import * as tableService from '../../services/tableService'
import type { BranchResponse } from '../../types/branch'
import type { RestaurantTable } from '../../types/table'
import type { TableSection } from '../../types/tableSection'
import { buildBranchOptions, getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'

type FormMode = 'create' | 'edit'

interface TableFormModalProps {
  open: boolean
  mode: FormMode
  table?: RestaurantTable | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  branchId: '',
  name: '',
  sectionId: '',
  capacity: '',
  active: true,
}

export function TableFormModal({ open, mode, table, onClose, onSuccess }: TableFormModalProps) {
  const { t, locale } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [sections, setSections] = useState<TableSection[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingSections, setLoadingSections] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return
    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }
    if (table) {
      setForm({
        branchId: String(table.branchId),
        name: table.name,
        sectionId: table.sectionId == null ? '' : String(table.sectionId),
        capacity: table.capacity == null ? '' : String(table.capacity),
        active: table.active,
      })
    }
  }, [isCreate, open, table])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadBranches() {
      setLoadingBranches(true)
      try {
        const data = await branchService.getBranches()
        if (!cancelled) setBranches(data)
      } catch (err) {
        if (!cancelled) {
          setError(translateApiError(err, t).message)
          setBranches([])
        }
      } finally {
        if (!cancelled) setLoadingBranches(false)
      }
    }
    void loadBranches()
    return () => {
      cancelled = true
    }
  }, [open, t])

  useEffect(() => {
    if (!open || !form.branchId) {
      setSections([])
      return
    }
    let cancelled = false
    async function loadSections() {
      setLoadingSections(true)
      try {
        const data = await tableSectionService.getTableSections(form.branchId)
        if (!cancelled) setSections(data)
      } catch (err) {
        if (!cancelled) {
          setError(translateApiError(err, t).message)
          setSections([])
        }
      } finally {
        if (!cancelled) setLoadingSections(false)
      }
    }
    void loadSections()
    return () => {
      cancelled = true
    }
  }, [form.branchId, open, t])

  const branchOptions = useMemo(() => {
    const selectable = buildBranchOptions(branches, table?.branchId ?? null)
    return [
      {
        value: '',
        label: loadingBranches ? t('tables.form.loadingBranches') : t('tables.form.selectBranch'),
      },
      ...selectable.map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    ]
  }, [branches, loadingBranches, locale, t, table?.branchId])

  function validate(): string | null {
    if (!form.branchId) return t('tables.validation.branchRequired')
    if (!form.name.trim()) return t('tables.validation.nameRequired')
    if (form.capacity && Number(form.capacity) < 1) return t('tables.validation.capacityMin')
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = {
        branchId: Number(form.branchId),
        name: form.name.trim(),
        sectionId: form.sectionId ? Number(form.sectionId) : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        active: form.active,
      }
      if (isCreate) {
        await tableService.createTable(payload)
      } else if (table) {
        await tableService.updateTable(table.id, payload)
      }
      onSuccess()
      onClose()
    } catch {
      // Mutation errors are translated by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="medium"
      title={isCreate ? t('tables.form.createTitle') : t('tables.form.editTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="table-form" variant="primary" disabled={saving}>
            {saving ? t('tables.actions.saving') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="table-form" className="form form-card" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}
        <FieldGrid columns={2}>
          <FormField label={t('tables.fields.branch')}>
            <FormSelect
              value={form.branchId}
              onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value, sectionId: '' }))}
              disabled={saving || loadingBranches}
              required
            >
              {branchOptions.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('tables.fields.name')} htmlFor="table-name">
            <FormInput
              id="table-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
              required
            />
          </FormField>
          <FormField label={t('tables.fields.section')} htmlFor="table-section">
            <FormSelect
              id="table-section"
              value={form.sectionId}
              onChange={(e) => setForm((prev) => ({ ...prev, sectionId: e.target.value }))}
              disabled={saving || loadingSections || !form.branchId}
            >
              <option value="">
                {loadingSections ? t('tables.sections.loading') : t('tables.filters.noSection')}
              </option>
              {sections.map((section) => (
                <option key={section.id} value={String(section.id)}>
                  {locale === 'ar' ? section.nameAr || section.name : section.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label={t('tables.fields.capacity')} htmlFor="table-capacity">
            <FormInput
              id="table-capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
              disabled={saving}
            />
          </FormField>
          <FormField label={t('common.status')}>
            <StatusSwitch
              active={form.active}
              disabled={saving}
              onChange={(active) => setForm((prev) => ({ ...prev, active }))}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
