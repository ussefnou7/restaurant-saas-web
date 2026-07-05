import { useState } from 'react'
import { FormField, FormInput } from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { ListPage } from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { useNotify } from '../../../components/ui/NotificationContext'
import { useTranslation } from '../../../i18n/useTranslation'
import { authService } from '../../../services/authService'
import * as adminInventoryService from '../../../services/adminInventoryService'
import type { InventorySeedSummaryResponse } from '../../../types/inventory'
import { isSysAdmin } from '../../../utils/inventoryAccess'
import { AdminInventoryAccessDenied } from './AdminInventoryAccessDenied'

type SeedAction = 'global' | 'tenant' | null

function SeedResultSummary({
  title,
  result,
}: {
  title: string
  result: InventorySeedSummaryResponse
}) {
  const { t } = useTranslation()

  return (
    <div className="inventory-import-summary">
      <h3 className="inventory-import-summary__title">{title}</h3>
      <div className="inventory-import-summary__stats">
        <span>
          {t('inventory.admin.seed.summaryCreated')}: {result.createdCount}
        </span>
        <span>
          {t('inventory.admin.seed.summaryUpdated')}: {result.updatedCount}
        </span>
        <span>
          {t('inventory.admin.seed.summarySkipped')}: {result.skippedCount}
        </span>
      </div>
      {result.messages.length > 0 ? (
        <div className="inventory-import-summary__skipped">
          <p className="inventory-import-summary__skipped-title">
            {t('inventory.admin.seed.messagesTitle')}
          </p>
          <ul>
            {result.messages.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function InventorySeedPage() {
  const { t } = useTranslation()
  const notify = useNotify()
  const canAccess = isSysAdmin()
  const authUser = authService.getAuthUser()

  const [tenantId, setTenantId] = useState(
    authUser?.tenantId != null ? String(authUser.tenantId) : '',
  )
  const [confirmAction, setConfirmAction] = useState<SeedAction>(null)
  const [running, setRunning] = useState(false)
  const [globalResult, setGlobalResult] = useState<InventorySeedSummaryResponse | null>(null)
  const [tenantResult, setTenantResult] = useState<InventorySeedSummaryResponse | null>(null)

  if (!canAccess) return <AdminInventoryAccessDenied />

  async function runSeed(action: SeedAction) {
    if (!action) return

    setRunning(true)
    try {
      if (action === 'global') {
        const result = await adminInventoryService.seedGlobalCatalog()
        setGlobalResult(result)
        notify.success(t('inventory.admin.seed.success'))
      } else {
        const id = tenantId.trim()
        if (!id) {
          notify.error(t('inventory.admin.seed.tenantIdRequired'))
          return
        }
        const result = await adminInventoryService.seedDemoTenantData(id)
        setTenantResult(result)
        notify.success(t('inventory.admin.seed.success'))
      }
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRunning(false)
      setConfirmAction(null)
    }
  }

  const confirmTitle =
    confirmAction === 'global'
      ? t('inventory.admin.seed.confirmGlobalTitle')
      : t('inventory.admin.seed.confirmTenantTitle')

  const confirmMessage =
    confirmAction === 'global'
      ? t('inventory.admin.seed.confirmGlobalMessage')
      : t('inventory.admin.seed.confirmTenantMessage', { tenantId: tenantId.trim() })

  return (
    <ListPage className="inventory-seed-page">
      <PageHeader
        title={t('inventory.admin.seed.title')}
        description={t('inventory.admin.seed.subtitle')}
      />

      <div className="inventory-seed-actions">
        <section className="inventory-seed-card">
          <h2 className="inventory-seed-card__title">
            {t('inventory.admin.seed.globalCatalogTitle')}
          </h2>
          <p className="inventory-seed-card__description">
            {t('inventory.admin.seed.globalCatalogDescription')}
          </p>
          <Button
            variant="primary"
            disabled={running}
            onClick={() => setConfirmAction('global')}
          >
            {t('inventory.admin.seed.runGlobal')}
          </Button>
          {globalResult ? (
            <SeedResultSummary
              title={t('inventory.admin.seed.lastGlobalResult')}
              result={globalResult}
            />
          ) : null}
        </section>

        <section className="inventory-seed-card">
          <h2 className="inventory-seed-card__title">
            {t('inventory.admin.seed.demoTenantTitle')}
          </h2>
          <p className="inventory-seed-card__description">
            {t('inventory.admin.seed.demoTenantDescription')}
          </p>
          <FormField label={t('inventory.admin.seed.tenantIdLabel')} htmlFor="seed-tenant-id">
            <FormInput
              id="seed-tenant-id"
              type="number"
              ltr
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder={t('inventory.admin.seed.tenantIdPlaceholder')}
              disabled={running}
            />
          </FormField>
          <Button
            variant="primary"
            disabled={running}
            onClick={() => setConfirmAction('tenant')}
          >
            {t('inventory.admin.seed.runTenant')}
          </Button>
          {tenantResult ? (
            <SeedResultSummary
              title={t('inventory.admin.seed.lastTenantResult')}
              result={tenantResult}
            />
          ) : null}
        </section>
      </div>

      <ConfirmModal
        open={confirmAction != null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={t('inventory.admin.seed.confirmRun')}
        loading={running}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void runSeed(confirmAction)}
      />
    </ListPage>
  )
}
