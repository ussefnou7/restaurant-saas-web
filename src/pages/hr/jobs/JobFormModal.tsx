import { useEffect, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormTextarea } from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { TenantCodeInput } from '../../../components/ui/TenantCodeInput'
import * as jobService from '../../../services/jobService'
import type { JobResponse } from '../../../types/job'

type FormMode = 'create' | 'edit'

interface JobFormModalProps {
  open: boolean
  mode: FormMode
  job?: JobResponse | null
  onClose: () => void
  onSuccess: () => void
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  active: true,
}

export function JobFormModal({ open, mode, job, onClose, onSuccess }: JobFormModalProps) {
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

    if (job) {
      setForm({
        name: job.name,
        code: job.code,
        description: job.description ?? '',
        active: job.active,
      })
    }
  }, [open, isCreate, job])

  function validate(): string | null {
    if (!form.name.trim()) return 'Job name is required'
    if (!form.code.trim()) return 'Job code is required'
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
        description: form.description.trim() || undefined,
        active: form.active,
      }

      if (isCreate) {
        await jobService.createJob(payload)
      } else if (job) {
        await jobService.updateJob(job.id, payload)
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
      title={isCreate ? 'Add Job' : 'Edit Job'}
      subtitle={
        isCreate ? 'Create a new HR job title.' : 'Update job details and status.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="job-form" variant="primary" disabled={saving}>
            {saving
              ? isCreate
                ? 'Creating…'
                : 'Saving…'
              : isCreate
                ? 'Create Job'
                : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="job-form" className="form" onSubmit={handleSubmit}>
        {error ? <div className="alert-error">{error}</div> : null}

        <FieldGrid columns={2}>
          <FormField label="Job Name" htmlFor="jobName">
            <FormInput
              id="jobName"
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Head Chef"
              required
              disabled={saving}
            />
          </FormField>

          <TenantCodeInput
            id="jobCode"
            label="Job Code"
            entityPrefix="JOB"
            value={form.code}
            onChange={(code) => setForm((prev) => ({ ...prev, code }))}
            disabled={saving}
            required
            placeholder="CASHIER"
            helperText="Only type the suffix after KFC-JOB-. The full code is generated automatically."
          />

          <FormField fullWidth label="Active job" htmlFor="jobActive">
            <div className="checkbox-card">
              <input
                id="jobActive"
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                disabled={saving}
              />
              <div className="checkbox-card-text">
                <label htmlFor="jobActive">Active job</label>
                <span className="field-helper">
                  Inactive jobs will not be available for employee assignment.
                </span>
              </div>
            </div>
          </FormField>

          <FormField fullWidth label="Description" htmlFor="jobDescription">
            <FormTextarea
              id="jobDescription"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Brief description of responsibilities and scope"
              rows={3}
              disabled={saving}
            />
          </FormField>
        </FieldGrid>
      </form>
    </Modal>
  )
}
