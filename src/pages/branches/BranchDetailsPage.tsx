import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { DetailTabPanel, DetailTabs } from '../../components/entity-detail/DetailTabs'
import { EntityDetailLayout } from '../../components/entity-detail/EntityDetailLayout'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import type { BranchResponse } from '../../types/branch'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { BranchComingSoonTab } from './BranchComingSoonTab'
import { BranchOverviewPanel } from './BranchOverviewPanel'

const TAB_OVERVIEW = 'overview'
const TAB_EMPLOYEES = 'employees'
const TAB_INVENTORY = 'inventory'
const TAB_ORDERS = 'orders'
const TAB_REPORTS = 'reports'

const FUTURE_TABS = new Set([TAB_EMPLOYEES, TAB_INVENTORY, TAB_ORDERS, TAB_REPORTS])

export function BranchDetailsPage() {
  const { t, locale } = useTranslation()
  const { branchId } = useParams<{ branchId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [branch, setBranch] = useState<BranchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const tabParam = searchParams.get('tab') ?? TAB_OVERVIEW
  const activeTab = FUTURE_TABS.has(tabParam) ? tabParam : TAB_OVERVIEW

  const loadBranch = useCallback(async () => {
    if (!branchId) return

    setLoading(true)
    setError('')

    try {
      const branches = await branchService.getBranches()
      const found = branches.find((item) => String(item.id) === branchId) ?? null
      setBranch(found)
      if (!found) {
        setError(t('branchDetails.errors.notFound'))
      }
    } catch (err) {
      setBranch(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [branchId, t])

  useEffect(() => {
    void loadBranch()
  }, [loadBranch])

  const tabs = useMemo(
    () => [
      { id: TAB_OVERVIEW, label: t('branchDetails.tabs.overview') },
      { id: TAB_EMPLOYEES, label: t('branchDetails.tabs.employees') },
      { id: TAB_INVENTORY, label: t('branchDetails.tabs.inventory') },
      { id: TAB_ORDERS, label: t('branchDetails.tabs.orders') },
      { id: TAB_REPORTS, label: t('branchDetails.tabs.reports') },
    ],
    [t],
  )

  function setTab(tabId: string) {
    if (tabId !== TAB_OVERVIEW && isEditing) {
      setIsEditing(false)
    }
    if (tabId === TAB_OVERVIEW) {
      setSearchParams({})
      return
    }
    setSearchParams({ tab: tabId })
  }

  function handleStartEdit() {
    setTab(TAB_OVERVIEW)
    setIsEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
  }

  function handleSaved(updated: BranchResponse) {
    setBranch(updated)
    setIsEditing(false)
    setError('')
  }

  async function handleToggleStatus() {
    if (!branch || isEditing) return

    setStatusBusy(true)
    try {
      const updated = await branchService.updateBranchStatus(branch.id, !branch.active)
      setBranch(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="entity-detail-page">
        <LoadingState message={t('branches.loading')} />
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="entity-detail-page">
        <EntityDetailLayout
          backTo="/branches"
          backLabel={t('branchDetails.backToList')}
          title={t('branchDetails.notFoundTitle')}
        >
          <p className="entity-detail-page__not-found">
            {error || t('branchDetails.errors.notFound')}
          </p>
        </EntityDetailLayout>
      </div>
    )
  }

  const displayName = getLocalizedBranchName(branch, locale)

  const headerActions = isEditing ? null : (
    <div className="entity-detail-page__actions-inline">
      <Button variant="primary" size="sm" onClick={handleStartEdit}>
        {t('branchDetails.actions.editBranch')}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleToggleStatus()}
        disabled={statusBusy}
      >
        {branch.active
          ? t('branchDetails.actions.deactivateBranch')
          : t('branchDetails.actions.activateBranch')}
      </Button>
    </div>
  )

  return (
    <EntityDetailLayout
      className="entity-detail-page--branch"
      backTo="/branches"
      backLabel={t('branchDetails.backToList')}
      title={displayName}
      subtitle={branch.code}
      headerExtra={<StatusBadge active={branch.active} />}
      actions={headerActions}
    >
      {error ? <div className="page-error-banner">{error}</div> : null}

      <DetailTabs tabs={tabs} activeTab={activeTab} onTabChange={setTab} variant="master">
        <DetailTabPanel id={TAB_OVERVIEW} active={activeTab === TAB_OVERVIEW}>
          <BranchOverviewPanel
            branch={branch}
            editing={isEditing}
            onCancel={handleCancelEdit}
            onSaved={handleSaved}
          />
        </DetailTabPanel>

        <DetailTabPanel id={TAB_EMPLOYEES} active={activeTab === TAB_EMPLOYEES}>
          <BranchComingSoonTab />
        </DetailTabPanel>

        <DetailTabPanel id={TAB_INVENTORY} active={activeTab === TAB_INVENTORY}>
          <BranchComingSoonTab />
        </DetailTabPanel>

        <DetailTabPanel id={TAB_ORDERS} active={activeTab === TAB_ORDERS}>
          <BranchComingSoonTab />
        </DetailTabPanel>

        <DetailTabPanel id={TAB_REPORTS} active={activeTab === TAB_REPORTS}>
          <BranchComingSoonTab />
        </DetailTabPanel>
      </DetailTabs>
    </EntityDetailLayout>
  )
}
