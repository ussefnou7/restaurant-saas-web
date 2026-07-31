import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { FormField, FormInput } from '../fields'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { StatusToggle } from '../ui/StatusToggle'
import { useTranslation } from '../../i18n/useTranslation'
import * as tableSectionService from '../../services/tableSectionService'
import type { TableSection } from '../../types/tableSection'
import { translateApiError } from '../../utils/errors'

interface ManageSectionsModalProps {
  open: boolean
  branchId: string
  branchName: string
  onClose: () => void
  onChanged: () => void
}

const emptyForm = {
  name: '',
  nameAr: '',
}

export function ManageSectionsModal({
  open,
  branchId,
  branchName,
  onClose,
  onChanged,
}: ManageSectionsModalProps) {
  const { t } = useTranslation()
  const [sections, setSections] = useState<TableSection[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadSections = useCallback(async () => {
    if (!branchId) {
      setSections([])
      return
    }
    setLoading(true)
    setError('')
    try {
      setSections(await tableSectionService.getTableSections(branchId, { includeInactive: true }))
    } catch (err) {
      setError(translateApiError(err, t).message)
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [branchId, t])

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setEditingId(null)
    void loadSections()
  }, [loadSections, open])

  function startEdit(section: TableSection) {
    setEditingId(section.id)
    setForm({
      name: section.name,
      nameAr: section.nameAr ?? '',
    })
    setError('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!branchId) {
      setError(t('tables.sections.selectBranchFirst'))
      return
    }
    if (!form.name.trim()) {
      setError(t('tables.sections.validation.nameRequired'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        branchId: Number(branchId),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || null,
      }
      if (editingId == null) {
        await tableSectionService.createTableSection(payload)
      } else {
        await tableSectionService.updateTableSection(editingId, payload)
      }
      resetForm()
      await loadSections()
      onChanged()
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(section: TableSection) {
    setError('')
    try {
      if (section.active) {
        await tableSectionService.deactivateTableSection(section.id)
      } else {
        await tableSectionService.activateTableSection(section.id)
      }
      await loadSections()
      onChanged()
    } catch (err) {
      setError(translateApiError(err, t).message)
    }
  }

  async function handleDelete(section: TableSection) {
    setError('')
    try {
      await tableSectionService.deleteTableSection(section.id)
      await loadSections()
      onChanged()
    } catch (err) {
      setError(translateApiError(err, t).message)
    }
  }

  return (
    <Modal
      open={open}
      size="medium"
      className="manage-sections-modal"
      title={t('tables.sections.manageTitle')}
      subtitle={branchName}
      onClose={onClose}
    >
      <div className="manage-sections">
        {error ? <div className="alert-error">{error}</div> : null}

        <form className="manage-sections__form" onSubmit={handleSubmit}>
          <FormField label={t('tables.sections.fields.name')} htmlFor="section-name">
            <FormInput
              id="section-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              disabled={saving || !branchId}
              required
            />
          </FormField>
          <FormField label={t('tables.sections.fields.nameAr')} htmlFor="section-name-ar">
            <FormInput
              id="section-name-ar"
              value={form.nameAr}
              onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
              disabled={saving || !branchId}
            />
          </FormField>
          <div className="manage-sections__form-actions">
            <Button type="submit" variant="primary" disabled={saving || !branchId}>
              {editingId == null ? <Plus size={16} /> : <Check size={16} />}
              {editingId == null ? t('tables.sections.add') : t('tables.sections.save')}
            </Button>
            {editingId == null ? null : (
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                <X size={16} />
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </form>

        <div className="manage-sections__list">
          {loading ? <p>{t('tables.sections.loading')}</p> : null}
          {!loading && sections.length === 0 ? <p>{t('tables.sections.empty')}</p> : null}
          {sections.map((section) => (
            <div className="manage-sections__row" key={section.id}>
              <div className="manage-sections__row-text">
                <strong>{section.name}</strong>
                {section.nameAr ? <span>{section.nameAr}</span> : null}
              </div>
              <div className="manage-sections__row-actions">
                <StatusToggle
                  active={section.active}
                  disabled={saving}
                  entityName={section.name}
                  onToggle={() => void handleToggle(section)}
                />
                <Button variant="secondary" size="sm" onClick={() => startEdit(section)} disabled={saving}>
                  <Pencil size={16} />
                  {t('common.edit')}
                </Button>
                <Button variant="danger" size="sm" onClick={() => void handleDelete(section)} disabled={saving}>
                  <Trash2 size={16} />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
