import { Eye, Lock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CloseShiftModal } from '../../components/shifts/CloseShiftModal'
import { ForcedCloseBadge, ShiftStatusBadge } from '../../components/shifts/ShiftBadges'
import { Button } from '../../components/ui/Button'
import { ClearFiltersButton } from '../../components/ui/ClearFiltersButton'
import { DatePicker } from '../../components/ui/DatePicker'
import { ListCard, ListCardHeader, ListPage, ListPageStates } from '../../components/ui/ListPage'
import { ListPagination } from '../../components/ui/ListPagination'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as deviceService from '../../services/deviceService'
import * as shiftService from '../../services/shiftService'
import * as userService from '../../services/userService'
import type { BranchResponse } from '../../types/branch'
import type { Device } from '../../types/device'
import type { ShiftListItemResponse, ShiftListParams, ShiftStatus } from '../../types/shift'
import type { UserResponse } from '../../types/user'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { formatDateTime } from '../../utils/format'
import { useCanCloseShift, useCanViewShifts, useCanViewShiftVariance } from '../../utils/shiftAccess'
import {
  formatShiftBusinessDate,
  formatShiftDuration,
  formatSignedMoney,
} from '../../utils/shiftDisplay'

const PAGE_SIZE = 20
const SHIFT_STATUSES: Array<ShiftStatus | ''> = ['', 'OPEN', 'CLOSED']

export function ShiftsListPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canView = useCanViewShifts()
  const showVariance = useCanViewShiftVariance()
  const canClose = useCanCloseShift()

  const branchId = searchParams.get('branchId') ?? ''
  const deviceId = searchParams.get('deviceId') ?? ''
  const cashierUserId = searchParams.get('cashierUserId') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const status = (searchParams.get('status') ?? '') as ShiftStatus | ''
  const forcedClose = searchParams.get('forcedClose') ?? ''
  const page = Math.max(0, Number(searchParams.get('page') ?? '0') || 0)

  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [shifts, setShifts] = useState<ShiftListItemResponse[]>([])
  const [closingShift, setClosingShift] = useState<ShiftListItemResponse | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const hasFilters = Boolean(
    branchId || deviceId || cashierUserId || dateFrom || dateTo || status || forcedClose,
  )

  const updateFilters = useCallback(
    (updates: Record<string, string>, resetPage = true) => {
      const next = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
      if (resetPage) next.delete('page')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    if (!canView) return
    void Promise.all([
      branchService.getBranches().then(setBranches).catch(() => setBranches([])),
      deviceService.getDevices().then(setDevices).catch(() => setDevices([])),
      userService.getUsers().then(setUsers).catch(() => setUsers([])),
    ])
  }, [canView])

  const loadShifts = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setError('')
    try {
      const params: ShiftListParams = {
        page,
        size: PAGE_SIZE,
      }
      if (branchId) params.branchId = Number(branchId)
      if (deviceId) params.deviceId = Number(deviceId)
      if (cashierUserId) params.cashierUserId = Number(cashierUserId)
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (status) params.status = status
      if (forcedClose) params.forcedClose = forcedClose === 'true'

      const data = await shiftService.getShifts(params)
      setShifts(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setShifts([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [branchId, canView, cashierUserId, dateFrom, dateTo, deviceId, forcedClose, page, status, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadShifts(), 150)
    return () => window.clearTimeout(timer)
  }, [loadShifts])

  const branchOptions = useMemo(
    () => [
      { value: '', label: t('shifts.filters.allBranches') },
      ...branches.map((branch) => ({
        value: String(branch.id),
        label: getLocalizedBranchName(branch, locale),
      })),
    ],
    [branches, locale, t],
  )

  const deviceOptions = useMemo(
    () => [
      { value: '', label: t('shifts.filters.allDevices') },
      ...devices.map((device) => ({
        value: String(device.id),
        label: device.branchName
          ? t('shifts.filters.deviceWithBranch', {
              device: device.name,
              branch: device.branchName,
            })
          : device.name,
      })),
    ],
    [devices, t],
  )

  const cashierOptions = useMemo(
    () => [
      { value: '', label: t('shifts.filters.allCashiers') },
      ...users.map((user) => ({
        value: String(user.id),
        label: user.fullName || user.username,
      })),
    ],
    [t, users],
  )

  const statusOptions = useMemo(
    () =>
      SHIFT_STATUSES.map((value) => ({
        value,
        label: value ? t(`shifts.status.${value}`) : t('common.allStatuses'),
      })),
    [t],
  )

  const forcedCloseOptions = useMemo(
    () => [
      { value: '', label: t('shifts.filters.allForcedClose') },
      { value: 'true', label: t('shifts.forcedClose.yes') },
      { value: 'false', label: t('shifts.forcedClose.no') },
    ],
    [t],
  )

  function moneyCell(value?: number | null): string {
    return formatSignedMoney(value, t('common.empty.dash'))
  }

  if (!canView) {
    return (
      <ListPage className="shifts-page">
        <PageHeader
          title={t('shifts.accessDenied.title')}
          description={t('shifts.accessDenied.subtitle')}
        />
        <p className="page-error-banner">{t('shifts.accessDenied.message')}</p>
      </ListPage>
    )
  }

  return (
    <ListPage className="shifts-page">
      <PageHeader
        title={t('shifts.title')}
        description={t('shifts.subtitle')}
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('shifts.list.title')}
          subtitle={t('shifts.list.sortedByVariance')}
          toolbar={
            <div className="shifts-filter-grid">
              <SelectFilter
                value={branchId}
                onChange={(value) => updateFilters({ branchId: value })}
                options={branchOptions}
                ariaLabel={t('shifts.filters.branch')}
              />
              <SelectFilter
                value={deviceId}
                onChange={(value) => updateFilters({ deviceId: value })}
                options={deviceOptions}
                ariaLabel={t('shifts.filters.device')}
              />
              <SelectFilter
                value={cashierUserId}
                onChange={(value) => updateFilters({ cashierUserId: value })}
                options={cashierOptions}
                ariaLabel={t('shifts.filters.cashier')}
              />
              <DatePicker
                value={dateFrom}
                placeholder={t('shifts.filters.dateFrom')}
                ariaLabel={t('shifts.filters.dateFrom')}
                maxDate={dateTo || undefined}
                onChange={(value) => {
                  updateFilters({ dateFrom: value, dateTo: dateTo && value > dateTo ? '' : dateTo })
                }}
              />
              <DatePicker
                value={dateTo}
                placeholder={t('shifts.filters.dateTo')}
                ariaLabel={t('shifts.filters.dateTo')}
                minDate={dateFrom || undefined}
                onChange={(value) => updateFilters({ dateTo: value })}
              />
              <SelectFilter
                value={status}
                onChange={(value) => updateFilters({ status: value })}
                options={statusOptions}
                ariaLabel={t('shifts.filters.status')}
              />
              <SelectFilter
                value={forcedClose}
                onChange={(value) => updateFilters({ forcedClose: value })}
                options={forcedCloseOptions}
                ariaLabel={t('shifts.filters.forcedClose')}
              />
              {hasFilters ? <ClearFiltersButton onClick={() => setSearchParams({})} /> : null}
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('shifts.list.loading')}
          loadingColumns={showVariance ? 12 : 10}
          showEmpty={!loading && totalElements === 0 && !hasFilters}
          emptyTitle={t('shifts.empty.title')}
          emptyDescription={t('shifts.empty.description')}
          showFilterEmpty={!loading && totalElements === 0 && hasFilters}
          filterEmptyTitle={t('shifts.emptyFilter.title')}
          filterEmptyDescription={t('shifts.emptyFilter.description')}
          showTable={!loading && totalElements > 0}
          table={
            <table className="shifts-table">
              <thead>
                <tr className="shifts-table__row shifts-table__row--head">
                  <th className="shifts-table__th">{t('shifts.columns.cashier')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.device')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.branch')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.businessDate')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.openedAt')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.closedAt')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.duration')}</th>
                  {showVariance ? (
                    <>
                      <th className="shifts-table__th shifts-table__th--numeric">
                        {t('shifts.columns.variance')}
                      </th>
                      <th className="shifts-table__th shifts-table__th--numeric">
                        {t('shifts.columns.handoverVariance')}
                      </th>
                    </>
                  ) : null}
                  <th className="shifts-table__th">{t('shifts.columns.forcedClose')}</th>
                  <th className="shifts-table__th">{t('shifts.columns.status')}</th>
                  <th className="shifts-table__th shifts-table__th--actions">
                    {t('shifts.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="shifts-table__row">
                    <td className="shifts-table__cell">
                      {shift.cashierName ?? t('common.empty.dash')}
                    </td>
                    <td className="shifts-table__cell">{shift.deviceName}</td>
                    <td className="shifts-table__cell">{shift.branchName}</td>
                    <td className="shifts-table__cell shifts-table__cell--numeric" dir="ltr">
                      {formatShiftBusinessDate(shift.businessDate, locale)}
                    </td>
                    <td className="shifts-table__cell shifts-table__cell--numeric" dir="ltr">
                      {formatDateTime(shift.openedAt, locale)}
                    </td>
                    <td className="shifts-table__cell shifts-table__cell--numeric" dir="ltr">
                      {shift.closedAt
                        ? formatDateTime(shift.closedAt, locale)
                        : t('common.empty.dash')}
                    </td>
                    <td className="shifts-table__cell shifts-table__cell--numeric" dir="ltr">
                      {formatShiftDuration(shift.durationMinutes, t)}
                    </td>
                    {showVariance ? (
                      <>
                        <td className="shifts-table__cell shifts-table__cell--amount" dir="ltr">
                          {moneyCell(shift.variance)}
                        </td>
                        <td className="shifts-table__cell shifts-table__cell--amount" dir="ltr">
                          {moneyCell(shift.handoverVariance)}
                        </td>
                      </>
                    ) : null}
                    <td className="shifts-table__cell">
                      <ForcedCloseBadge forcedClose={shift.forcedClose} />
                    </td>
                    <td className="shifts-table__cell">
                      <ShiftStatusBadge status={shift.status} />
                    </td>
                    <td className="shifts-table__cell shifts-table__td--actions">
                      <div className="shifts-table__actions-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/shifts/${shift.id}`)}
                          aria-label={t('shifts.actions.view')}
                          title={t('shifts.actions.view')}
                        >
                          <Eye size={15} aria-hidden />
                          <span>{t('shifts.actions.view')}</span>
                        </Button>
                        {shift.status === 'OPEN' && canClose ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setClosingShift(shift)}
                            aria-label={t('shifts.actions.close')}
                            title={t('shifts.actions.close')}
                          >
                            <Lock size={15} aria-hidden />
                            <span>{t('shifts.actions.closeShort')}</span>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        />

        <ListPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={(value) => updateFilters({ page: String(value) }, false)}
          translationPrefix="shifts.pagination"
        />
      </ListCard>

      <CloseShiftModal
        shift={closingShift}
        open={Boolean(closingShift)}
        onClose={() => setClosingShift(null)}
        onSuccess={() => {
          setClosingShift(null)
          void loadShifts()
        }}
      />
    </ListPage>
  )
}
