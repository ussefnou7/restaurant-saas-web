import { Copy, TriangleAlert } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { FieldGrid, FormField, FormInput, FormSelect } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as deviceService from '../../services/deviceService'
import type { BranchResponse } from '../../types/branch'
import type { DeviceCreateResponse } from '../../types/device'
import { buildBranchOptions, getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'

interface DeviceCreateModalProps {
  open: boolean
  onClose: () => void
  onDone: () => void
}

const emptyForm = { name: '', branchId: '' }

export function DeviceCreateModal({ open, onClose, onDone }: DeviceCreateModalProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const secretInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(emptyForm)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdDevice, setCreatedDevice] = useState<DeviceCreateResponse | null>(null)

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

  const branchOptions = useMemo(
    () =>
      buildBranchOptions(branches).map((branch) => ({
        value: String(branch.id),
        label: `${getLocalizedBranchName(branch, locale)} (${branch.code})`,
      })),
    [branches, locale],
  )

  function handleClose() {
    if (createdDevice) {
      onDone()
    } else {
      onClose()
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError(t('devices.create.nameRequired'))
      return
    }
    if (!form.branchId) {
      setError(t('devices.create.branchRequired'))
      return
    }

    setSaving(true)
    try {
      const created = await deviceService.createDevice({
        name: form.name.trim(),
        branchId: Number(form.branchId),
      })
      setCreatedDevice(created)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setSaving(false)
    }
  }

  async function copySecret() {
    if (!createdDevice) return
    try {
      await navigator.clipboard.writeText(createdDevice.secretKey)
      notify.success(t('devices.secret.copied'))
    } catch {
      secretInputRef.current?.focus()
      secretInputRef.current?.select()
      notify.error(t('devices.secret.copyFailed'))
    }
  }

  const footer = createdDevice ? (
    <Button variant="primary" onClick={handleClose}>
      {t('devices.secret.done')}
    </Button>
  ) : (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={saving}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" form="device-create-form" variant="primary" disabled={saving}>
        {saving ? t('devices.create.submitting') : t('devices.create.submit')}
      </Button>
    </>
  )

  return (
    <Modal
      open={open}
      size="medium"
      className="device-create-modal"
      title={createdDevice ? t('devices.secret.title') : t('devices.create.title')}
      onClose={handleClose}
      footer={footer}
    >
      {createdDevice ? (
        <div className="device-create-modal__secret-reveal">
          <div className="device-create-modal__warning" role="alert">
            <TriangleAlert aria-hidden="true" />
            <p>{t('devices.secret.warning')}</p>
          </div>
          <div className="device-create-modal__secret-row">
            <input
              ref={secretInputRef}
              className="device-create-modal__secret-field"
              value={createdDevice.secretKey}
              readOnly
              dir="ltr"
              aria-label={t('devices.secret.title')}
              onFocus={(event) => event.currentTarget.select()}
            />
            <Button
              variant="secondary"
              className="device-create-modal__copy-btn"
              onClick={() => void copySecret()}
            >
              <Copy size={18} aria-hidden="true" />
              {t('devices.secret.copy')}
            </Button>
          </div>
          <div className="device-create-modal__qr">
            <QRCodeSVG value={createdDevice.secretKey} size={160} marginSize={2} />
            <div className="device-create-modal__qr-text">
              <p className="device-create-modal__qr-title">{t('devices.secret.qrTitle')}</p>
              <p className="device-create-modal__qr-note">{t('devices.secret.qrNote')}</p>
            </div>
          </div>
        </div>
      ) : (
        <form id="device-create-form" className="form form-card" onSubmit={handleSubmit}>
          {error ? <div className="alert-error">{error}</div> : null}
          <FieldGrid columns={2}>
            <FormField
              label={t('devices.create.name')}
              htmlFor="device-name"
              required
            >
              <FormInput
                id="device-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                disabled={saving}
                required
                autoFocus
              />
            </FormField>
            <FormField
              label={t('devices.create.branch')}
              htmlFor="device-branch"
              required
            >
              <FormSelect
                id="device-branch"
                value={form.branchId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, branchId: event.target.value }))
                }
                disabled={saving || loadingBranches}
                required
              >
                <option value="">
                  {loadingBranches
                    ? t('devices.create.loadingBranches')
                    : t('devices.create.selectBranch')}
                </option>
                {branchOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </FieldGrid>
        </form>
      )}
    </Modal>
  )
}
