import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormTextarea } from '../../components/fields'
import { Modal } from '../../components/ui/Modal'
import { TenantCodeInput } from '../../components/ui/TenantCodeInput'
import * as branchService from '../../services/branchService'
import type { BranchResponse } from '../../types/branch'

type FormMode = 'create' | 'edit'

interface BranchFormModalProps {
  open: boolean
  mode: FormMode
  branch?: BranchResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  code: '',
  phone: '',
  address: '',
  active: true,
}

export function BranchFormModal({ open, mode, branch, onClose, onSuccess }: BranchFormModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isCreate = mode === 'create'

  useEffect(() => {
    if (!open) return

    setError('')
    if (isCreate) {
      setForm(emptyForm)
      return
    }

    if (branch) {
      setForm({
        name: branch.name,
        code: branch.code,
        phone: branch.phone ?? '',
        address: branch.address ?? '',
        active: branch.active,
      })
    }
  }, [open, isCreate, branch])

  function validate(): string | null {
    if (!form.name.trim()) return 'Branch name is required'
    if (!form.code.trim()) return 'Branch code is required'
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
        name: form.name.trim(),
        code: form.code.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        active: form.active,
      }

      if (isCreate) {
        await branchService.createBranch(payload)
      } else if (branch) {
        await branchService.updateBranch(branch.id, payload)
      }

      onSuccess()
      onClose()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      size="wide"
      title={isCreate ? 'Add Branch' : 'Edit Branch'}
      subtitle={
        isCreate
          ? 'Create a new restaurant branch.'
          : 'Update branch details and status.'
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="submit"
            form="branch-form"
            className="button-primary"
            disabled={saving}
          >
            {saving
              ? isCreate
                ? 'Creating…'
                : 'Saving…'
              : isCreate
                ? 'Create Branch'
                : 'Save Changes'}
          </button>
        </>
      }
    >
      <form id="branch-form" className="form" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}

        <FieldGrid columns={2}>
          <FormField label="Branch Name" htmlFor="branchName">
            <FormInput
              id="branchName"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Downtown Branch"
              required
              disabled={saving}
            />
          </FormField>

          <TenantCodeInput
            id="branchCode"
            label="Branch Code"
            entityPrefix="BR"
            value={form.code}
            onChange={(code) => setForm((prev) => ({ ...prev, code }))}
            disabled={saving}
            required
            placeholder="MAIN"
            helperText="Only type the suffix after KFC-BR-. The full code is generated automatically."
          />

          <FormField label="Phone" htmlFor="branchPhone">
            <FormInput
              id="branchPhone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="+201000000000"
              disabled={saving}
            />
          </FormField>

          <FormField fullWidth label="Active branch" htmlFor="branchActive">
            <div className="checkbox-card">
              <input
                id="branchActive"
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                disabled={saving}
              />
              <div className="checkbox-card-text">
                <label htmlFor="branchActive">Active branch</label>
                <span className="field-helper">
                  Inactive branches will not be available for operations.
                </span>
              </div>
            </div>
          </FormField>

          <FormField fullWidth label="Address" htmlFor="branchAddress">
            <FormTextarea
              id="branchAddress"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              placeholder="Street, city, country"
              rows={3}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
