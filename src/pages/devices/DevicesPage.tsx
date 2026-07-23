import { Power } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { EntityCell } from '../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
} from '../../components/ui/ListPage'
import { useNotify } from '../../components/ui/NotificationContext'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
  ThActions,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as deviceService from '../../services/deviceService'
import type { BranchResponse } from '../../types/branch'
import type { Device } from '../../types/device'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { canManageDevices } from '../../utils/deviceAccess'
import { getApiErrorCode, translateApiError } from '../../utils/errors'
import { DeviceCreateModal } from './DeviceCreateModal'

export function DevicesPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canManage = canManageDevices()
  const [devices, setDevices] = useState<Device[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deactivating, setDeactivating] = useState<Device | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await deviceService.getDevices()
      setDevices(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!canManage) return
    void branchService
      .getBranches()
      .then(setBranches)
      .catch((err) => {
        setBranches([])
        notify.error(translateApiError(err, t).message)
      })
  }, [canManage, notify, t])

  useEffect(() => {
    if (!canManage) return
    const timer = window.setTimeout(() => void loadDevices(), 0)
    return () => window.clearTimeout(timer)
  }, [canManage, loadDevices])

  async function handleDeactivate() {
    if (!deactivating) return
    setActionLoading(true)
    try {
      await deviceService.deactivateDevice(deactivating.id)
      notify.success(t('devices.toast.deactivateSuccess'))
      setDeactivating(null)
      await loadDevices()
    } catch (err) {
      const errorCode = getApiErrorCode(err)
      notify.error(translateApiError(err, t).message)
      if (errorCode === 'DEVICE_NOT_FOUND') {
        setDeactivating(null)
        await loadDevices()
      }
    } finally {
      setActionLoading(false)
    }
  }

  function getBranchLabel(device: Device): string {
    if (device.branchName) return device.branchName
    const branch = branches.find((candidate) => candidate.id === device.branchId)
    return branch ? getLocalizedBranchName(branch, locale) : t('common.empty.dash')
  }

  function formatLastLogin(value: string | null): string {
    if (!value) return t('common.empty.dash')
    return new Date(value).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (!canManage) {
    return (
      <ListPage className="devices-page">
        <PageHeader
          title={t('devices.accessDenied.title')}
          description={t('devices.accessDenied.subtitle')}
        />
        <p className="page-error-banner">{t('devices.accessDenied.message')}</p>
      </ListPage>
    )
  }

  const showEmpty = !loading && !error && devices.length === 0
  const showTable = !loading && !error && devices.length > 0

  return (
    <ListPage className="devices-page">
      <PageHeader
        title={t('devices.title')}
        description={t('devices.subtitle')}
        action={
          <ListPrimaryAction label={t('devices.add')} onClick={() => setCreateOpen(true)} />
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader title={t('devices.listTitle')} />
        <ListPageStates
          loading={loading}
          loadingMessage={t('devices.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('devices.empty.title')}
          emptyDescription={t('devices.empty.subtitle')}
          emptyActionLabel={t('devices.add')}
          onEmptyAction={() => setCreateOpen(true)}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable className="devices-page__table">
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('devices.columns.name')}</Th>
                  <Th>{t('devices.columns.branch')}</Th>
                  <Th column="status">{t('devices.columns.status')}</Th>
                  <Th column="date">{t('devices.columns.lastLogin')}</Th>
                  <ThActions>{t('devices.columns.actions')}</ThActions>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <Td column="entity">
                      <EntityCell name={device.name} compact />
                    </Td>
                    <Td>{getBranchLabel(device)}</Td>
                    <Td column="status">
                      <Badge variant={device.active ? 'success' : 'inactive'}>
                        {device.active
                          ? t('devices.status.active')
                          : t('devices.status.inactive')}
                      </Badge>
                    </Td>
                    <Td column="date">{formatLastLogin(device.lastLoginAt)}</Td>
                    <Td column="actions">
                      {device.active ? (
                        <Button
                          variant="danger"
                          size="action"
                          className="devices-page__deactivate-btn"
                          onClick={() => setDeactivating(device)}
                        >
                          <Power size={16} aria-hidden="true" />
                          {t('devices.actions.deactivate')}
                        </Button>
                      ) : null}
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      {createOpen ? (
        <DeviceCreateModal
          open
          onClose={() => setCreateOpen(false)}
          onDone={() => {
            setCreateOpen(false)
            notify.success(t('devices.toast.createSuccess'))
            void loadDevices()
          }}
        />
      ) : null}

      <ConfirmModal
        open={deactivating !== null}
        title={t('devices.confirm.title')}
        message={t('devices.confirm.message', { name: deactivating?.name ?? '' })}
        confirmLabel={t('devices.confirm.confirm')}
        loadingLabel={t('devices.confirm.loading')}
        loading={actionLoading}
        onClose={() => setDeactivating(null)}
        onConfirm={() => void handleDeactivate()}
      />
    </ListPage>
  )
}
