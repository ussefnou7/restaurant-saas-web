import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { useAccess } from '../../access/useAuthSession'
import { DetailsCard, FieldGrid, FormField, FormInput, OnOffSwitch, SectionGroup } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useNotify } from '../../components/ui/NotificationContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import * as tenantSettingsService from '../../services/tenantSettingsService'
import type { TenantSettingsResponse, UpdateTenantSettingsRequest } from '../../types/tenantSettings'
import { translateApiError } from '../../utils/errors'

type SettingsForm = {
  taxEnabled: boolean
  taxRate: string
  taxOnServiceCharge: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: string
  dineInEnabled: boolean
  takeawayEnabled: boolean
  deliveryEnabled: boolean
}

function formFromSettings(settings: TenantSettingsResponse): SettingsForm {
  return {
    taxEnabled: settings.taxEnabled,
    taxRate: String(settings.taxRate),
    taxOnServiceCharge: settings.taxOnServiceCharge,
    serviceChargeEnabled: settings.serviceChargeEnabled,
    serviceChargeRate: String(settings.serviceChargeRate),
    dineInEnabled: settings.dineInEnabled,
    takeawayEnabled: settings.takeawayEnabled,
    deliveryEnabled: settings.deliveryEnabled,
  }
}

function isRate(value: string): boolean {
  return /^\d{1,3}(\.\d{1,4})?$/.test(value) && Number(value) >= 0 && Number(value) <= 100
}

export function SettingsPage() {
  const { t } = useTranslation()
  const { can, canAny } = useAccess()
  const notify = useNotify()
  const [settings, setSettings] = useState<TenantSettingsResponse | null>(null)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [validationError, setValidationError] = useState('')

  const canView = canAny(['TENANT_SETTINGS_VIEW', 'TENANT_SETTINGS_MANAGE'])
  const canManage = can('TENANT_SETTINGS_MANAGE')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await tenantSettingsService.getTenantSettings()
      setSettings(response)
      setForm(formFromSettings(response))
    } catch (error) {
      setSettings(null)
      setForm(null)
      setLoadError(translateApiError(error, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (canView) void loadSettings()
  }, [canView, loadSettings])

  function updateForm(change: Partial<SettingsForm>) {
    setForm((current) => (current ? { ...current, ...change } : current))
    setValidationError('')
  }

  function validate(): UpdateTenantSettingsRequest | null {
    if (!form) return null
    const taxRate = form.taxRate.trim()
    const serviceChargeRate = form.serviceChargeRate.trim()
    if (!isRate(taxRate) || !isRate(serviceChargeRate)) {
      setValidationError(t('tenantSettings.validation.rate'))
      return null
    }
    if (!form.dineInEnabled && !form.takeawayEnabled && !form.deliveryEnabled) {
      setValidationError(t('tenantSettings.validation.orderTypeRequired'))
      return null
    }
    return {
      taxEnabled: form.taxEnabled,
      taxRate: Number(taxRate),
      taxOnServiceCharge: form.taxOnServiceCharge,
      serviceChargeEnabled: form.serviceChargeEnabled,
      serviceChargeRate: Number(serviceChargeRate),
      dineInEnabled: form.dineInEnabled,
      takeawayEnabled: form.takeawayEnabled,
      deliveryEnabled: form.deliveryEnabled,
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setValidationError('')
    const payload = validate()
    if (!payload) return

    setSaving(true)
    try {
      const updated = await tenantSettingsService.updateTenantSettings(payload)
      setSettings(updated)
      setForm(formFromSettings(updated))
      notify.success(t('tenantSettings.feedback.saved'))
    } catch {
      // Mutations are translated and displayed by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="page tenant-settings-page"><LoadingState message={t('tenantSettings.loading')} /></main>
  }

  if (!settings || !form) {
    return (
      <main className="page tenant-settings-page">
        <PageHeader title={t('tenantSettings.title')} description={t('tenantSettings.descriptionGeneric')} />
        <ErrorState message={loadError || t('tenantSettings.errors.load')} onRetry={() => void loadSettings()} />
      </main>
    )
  }

  return (
    <main className="page tenant-settings-page">
      <PageHeader
        title={t('tenantSettings.title')}
        description={t('tenantSettings.description', { tenantName: settings.tenantName })}
      />
      <form className="tenant-settings-page__form" onSubmit={(event) => void handleSubmit(event)}>
        {validationError ? <div className="alert-error" role="alert">{validationError}</div> : null}

        <DetailsCard className="tenant-settings-page__card">
          <SectionGroup title={t('tenantSettings.sections.tax')} subtitle={t('tenantSettings.sections.taxHelp')} divider={false}>
            <FieldGrid columns={2}>
              <SettingSwitch label={t('tenantSettings.fields.taxEnabled')} helper={t('tenantSettings.helpers.taxEnabled')} checked={form.taxEnabled} disabled={!canManage || saving} onChange={(taxEnabled) => updateForm({ taxEnabled })} />
              <FormField label={t('tenantSettings.fields.taxRate')} htmlFor="tenant-settings-tax-rate" helper={t('tenantSettings.helpers.rate')} disabled={!canManage || saving} required>
                <FormInput id="tenant-settings-tax-rate" type="number" inputMode="decimal" min="0" max="100" step="0.0001" ltr value={form.taxRate} onChange={(event) => updateForm({ taxRate: event.target.value })} disabled={!canManage || saving} />
              </FormField>
              <SettingSwitch label={t('tenantSettings.fields.taxOnServiceCharge')} helper={t('tenantSettings.helpers.taxOnServiceCharge')} checked={form.taxOnServiceCharge} disabled={!canManage || saving} onChange={(taxOnServiceCharge) => updateForm({ taxOnServiceCharge })} />
            </FieldGrid>
          </SectionGroup>

          <SectionGroup title={t('tenantSettings.sections.service')} subtitle={t('tenantSettings.sections.serviceHelp')}>
            <FieldGrid columns={2}>
              <SettingSwitch label={t('tenantSettings.fields.serviceChargeEnabled')} helper={t('tenantSettings.helpers.serviceChargeEnabled')} checked={form.serviceChargeEnabled} disabled={!canManage || saving} onChange={(serviceChargeEnabled) => updateForm({ serviceChargeEnabled })} />
              <FormField label={t('tenantSettings.fields.serviceChargeRate')} htmlFor="tenant-settings-service-rate" helper={t('tenantSettings.helpers.rate')} disabled={!canManage || saving} required>
                <FormInput id="tenant-settings-service-rate" type="number" inputMode="decimal" min="0" max="100" step="0.0001" ltr value={form.serviceChargeRate} onChange={(event) => updateForm({ serviceChargeRate: event.target.value })} disabled={!canManage || saving} />
              </FormField>
            </FieldGrid>
          </SectionGroup>

          <SectionGroup title={t('tenantSettings.sections.orderTypes')} subtitle={t('tenantSettings.sections.orderTypesHelp')}>
            <FieldGrid columns={3}>
              <SettingSwitch label={t('tenantSettings.fields.dineInEnabled')} checked={form.dineInEnabled} disabled={!canManage || saving} onChange={(dineInEnabled) => updateForm({ dineInEnabled })} />
              <SettingSwitch label={t('tenantSettings.fields.takeawayEnabled')} checked={form.takeawayEnabled} disabled={!canManage || saving} onChange={(takeawayEnabled) => updateForm({ takeawayEnabled })} />
              <SettingSwitch label={t('tenantSettings.fields.deliveryEnabled')} checked={form.deliveryEnabled} disabled={!canManage || saving} onChange={(deliveryEnabled) => updateForm({ deliveryEnabled })} />
            </FieldGrid>
          </SectionGroup>
        </DetailsCard>

        {canManage ? (
          <footer className="tenant-settings-page__footer">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              <span>{saving ? t('tenantSettings.actions.saving') : t('tenantSettings.actions.save')}</span>
            </Button>
          </footer>
        ) : <p className="tenant-settings-page__read-only">{t('tenantSettings.readOnly')}</p>}
      </form>
    </main>
  )
}

function SettingSwitch({
  label,
  helper,
  checked,
  disabled,
  onChange,
}: {
  label: string
  helper?: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="tenant-settings-page__switch-field">
      <div>
        <p className="tenant-settings-page__switch-label">{label}</p>
        {helper ? <p className="tenant-settings-page__switch-helper">{helper}</p> : null}
      </div>
      <OnOffSwitch checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  )
}
