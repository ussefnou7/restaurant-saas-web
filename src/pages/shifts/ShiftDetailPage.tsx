import { AlertTriangle, Lock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DetailsCard } from '../../components/fields'
import { EntityDetailScreen } from '../../components/entity-detail/EntityDetailScreen'
import { CloseShiftModal } from '../../components/shifts/CloseShiftModal'
import {
  ForcedCloseBadge,
  ShiftExpenseStatusBadge,
  ShiftStatusBadge,
} from '../../components/shifts/ShiftBadges'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useTranslation } from '../../i18n/useTranslation'
import * as shiftService from '../../services/shiftService'
import type {
  ShiftDetailResponse,
  ShiftExpenseLine,
  ShiftOrderLine,
  ShiftOrderStatus,
  ShiftPaymentMethod,
} from '../../types/shift'
import { translateApiError } from '../../utils/errors'
import { formatDateTime, formatMoney } from '../../utils/format'
import { useCanCloseShift, useCanViewShiftVariance } from '../../utils/shiftAccess'
import {
  formatShiftBusinessDate,
  formatShiftDuration,
  formatSignedMoney,
  getShiftPaymentMethodLabel,
} from '../../utils/shiftDisplay'

const PAYMENT_METHODS: ShiftPaymentMethod[] = ['CASH', 'CARD', 'WALLET']

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="shifts-detail-info__item">
      <span className="shifts-detail-info__label">{label}</span>
      <span className="shifts-detail-info__value">{value}</span>
    </div>
  )
}

function OrderStatusBadge({ status }: { status: ShiftOrderStatus }) {
  const { t } = useTranslation()
  return (
    <Badge variant={status === 'COMPLETE' ? 'success' : 'danger'}>
      {t(`shifts.orderStatus.${status}`)}
    </Badge>
  )
}

export function ShiftDetailPage() {
  const { t, locale } = useTranslation()
  const { shiftId } = useParams<{ shiftId: string }>()
  const showVariance = useCanViewShiftVariance()
  const canClose = useCanCloseShift()
  const [detail, setDetail] = useState<ShiftDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)

  useDocumentTitle(shiftId ? t('shifts.detail.documentTitle', { id: shiftId }) : undefined)

  const loadShift = useCallback(async () => {
    if (!shiftId) return
    setLoading(true)
    setError('')
    try {
      const response = await shiftService.getShift(shiftId)
      setDetail(response)
    } catch (err) {
      setDetail(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [shiftId, t])

  useEffect(() => {
    void loadShift()
  }, [loadShift])

  const shift = detail?.shift

  const title = shift ? t('shifts.detail.title', { id: shift.id }) : undefined
  const subtitle = shift
    ? [
        shift.cashierName ?? t('common.empty.dash'),
        shift.deviceName,
        formatShiftBusinessDate(shift.businessDate, locale),
      ].join(' · ')
    : undefined

  const badges = shift ? (
    <div className="shifts-detail__badges">
      <ShiftStatusBadge status={shift.status} />
      <ForcedCloseBadge forcedClose={shift.forcedClose} />
    </div>
  ) : undefined

  const overview = shift ? (
    <div className="shifts-detail-info">
      <InfoItem label={t('shifts.columns.cashier')} value={shift.cashierName ?? t('common.empty.dash')} />
      <InfoItem label={t('shifts.columns.closedBy')} value={shift.closedByUserName ?? t('common.empty.dash')} />
      <InfoItem label={t('shifts.columns.device')} value={shift.deviceName} />
      <InfoItem label={t('shifts.columns.branch')} value={shift.branchName} />
      <InfoItem
        label={t('shifts.columns.businessDate')}
        value={formatShiftBusinessDate(shift.businessDate, locale)}
      />
      <InfoItem label={t('shifts.columns.duration')} value={formatShiftDuration(shift.durationMinutes, t)} />
      <InfoItem label={t('shifts.columns.openedAt')} value={formatDateTime(shift.openedAt, locale)} />
      <InfoItem
        label={t('shifts.columns.closedAt')}
        value={shift.closedAt ? formatDateTime(shift.closedAt, locale) : t('common.empty.dash')}
      />
    </div>
  ) : null

  const paymentBreakdown = useMemo(() => {
    if (!detail) return []
    return PAYMENT_METHODS.map((method) => ({
      method,
      amount: detail.salesByPaymentMethod?.[method],
    }))
  }, [detail])

  function empty(): string {
    return t('common.empty.dash')
  }

  function money(value?: number | null): string {
    return value === null || value === undefined ? empty() : formatMoney(value)
  }

  function signedMoney(value?: number | null): string {
    return formatSignedMoney(value, empty())
  }

  function renderOrders(orders: ShiftOrderLine[]) {
    if (orders.length === 0) {
      return (
        <EmptyState
          title={t('shifts.orders.empty.title')}
          description={t('shifts.orders.empty.description')}
        />
      )
    }

    return (
      <div className="table-wrap shifts-detail__table-wrap">
        <table className="shifts-detail-table shifts-detail-table--orders">
          <thead>
            <tr className="shifts-detail-table__row shifts-detail-table__row--head">
              <th className="shifts-detail-table__th">{t('shifts.orders.columns.orderNo')}</th>
              <th className="shifts-detail-table__th">{t('shifts.orders.columns.orderDate')}</th>
              <th className="shifts-detail-table__th">{t('shifts.orders.columns.status')}</th>
              <th className="shifts-detail-table__th">{t('shifts.orders.columns.paymentMethod')}</th>
              <th className="shifts-detail-table__th shifts-detail-table__th--numeric">
                {t('shifts.orders.columns.totalAmount')}
              </th>
              <th className="shifts-detail-table__th">{t('shifts.orders.columns.recordedBy')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="shifts-detail-table__row">
                <td className="shifts-detail-table__cell">
                  {order.orderNo ?? t('shifts.orders.orderFallback', { id: order.id })}
                </td>
                <td className="shifts-detail-table__cell shifts-detail-table__cell--numeric" dir="ltr">
                  {formatDateTime(order.orderDate, locale)}
                </td>
                <td className="shifts-detail-table__cell">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="shifts-detail-table__cell">
                  {getShiftPaymentMethodLabel(order.paymentMethod, t)}
                </td>
                <td className="shifts-detail-table__cell shifts-detail-table__cell--amount" dir="ltr">
                  {money(order.totalAmount)}
                </td>
                <td className="shifts-detail-table__cell">
                  {order.createdByName ?? t('common.empty.dash')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderExpenses(expenses: ShiftExpenseLine[]) {
    if (expenses.length === 0) {
      return (
        <EmptyState
          title={t('shifts.expenses.empty.title')}
          description={t('shifts.expenses.empty.description')}
        />
      )
    }

    return (
      <div className="table-wrap shifts-detail__table-wrap">
        <table className="shifts-detail-table shifts-detail-table--expenses">
          <thead>
            <tr className="shifts-detail-table__row shifts-detail-table__row--head">
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.expenseDate')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.category')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.description')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.payee')}</th>
              <th className="shifts-detail-table__th shifts-detail-table__th--numeric">
                {t('shifts.expenses.columns.amount')}
              </th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.status')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.recordedBy')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.recordedAt')}</th>
              <th className="shifts-detail-table__th">{t('shifts.expenses.columns.late')}</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="shifts-detail-table__row">
                <td className="shifts-detail-table__cell shifts-detail-table__cell--numeric" dir="ltr">
                  {formatShiftBusinessDate(expense.expenseDate, locale)}
                </td>
                <td className="shifts-detail-table__cell">
                  {expense.categoryName ?? t('common.empty.dash')}
                </td>
                <td className="shifts-detail-table__cell">
                  {expense.description ?? t('common.empty.dash')}
                </td>
                <td className="shifts-detail-table__cell">
                  {expense.payeeName ?? t('common.empty.dash')}
                </td>
                <td className="shifts-detail-table__cell shifts-detail-table__cell--amount" dir="ltr">
                  {money(expense.amount)}
                </td>
                <td className="shifts-detail-table__cell">
                  <ShiftExpenseStatusBadge status={expense.status} />
                </td>
                <td className="shifts-detail-table__cell">
                  {expense.recordedByName ?? t('common.empty.dash')}
                </td>
                <td className="shifts-detail-table__cell shifts-detail-table__cell--numeric" dir="ltr">
                  {formatDateTime(expense.createdAt, locale)}
                </td>
                <td className="shifts-detail-table__cell">
                  {expense.recordedAfterClose ? (
                    <span className="shifts-detail-table__late" title={t('shifts.expenses.lateTitle')}>
                      <AlertTriangle size={14} aria-hidden />
                      {t('shifts.expenses.late')}
                    </span>
                  ) : (
                    t('shifts.expenses.onTime')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <EntityDetailScreen
        title={title}
        subtitle={subtitle}
        badge={badges}
        actions={
          shift && shift.status === 'OPEN' && canClose ? (
            <Button variant="primary" onClick={() => setIsCloseModalOpen(true)}>
              <Lock size={16} aria-hidden />
              <span>{t('shifts.actions.close')}</span>
            </Button>
          ) : undefined
        }
        backTo="/shifts"
        backLabel={t('shifts.detail.back')}
        loading={loading}
        loadingMessage={t('shifts.detail.loading')}
        notFound={!loading && !detail && !error}
        notFoundTitle={t('shifts.detail.notFound.title')}
        notFoundMessage={t('shifts.detail.notFound.description')}
        error={error}
        overview={overview}
      >
        {detail ? (
          <div className="shifts-detail">
            {showVariance ? (
              <DetailsCard title={t('shifts.breakdown.title')}>
                <div className="shifts-breakdown-grid">
                  <InfoItem label={t('shifts.breakdown.cashSales')} value={money(detail.cashSales)} />
                  <InfoItem label={t('shifts.breakdown.expensesAtClose')} value={money(detail.expensesAtClose)} />
                  <InfoItem label={t('shifts.breakdown.varianceAtClose')} value={signedMoney(detail.shift.variance)} />
                  <InfoItem label={t('shifts.breakdown.lateExpenses')} value={money(detail.lateExpenses)} />
                  <InfoItem label={t('shifts.breakdown.explainedVariance')} value={signedMoney(detail.explainedVariance)} />
                </div>
                <div className="shifts-payment-breakdown">
                  {paymentBreakdown.map((item) => (
                    <div key={item.method} className="shifts-payment-breakdown__item">
                      <span>{getShiftPaymentMethodLabel(item.method, t)}</span>
                      <strong dir="ltr">{money(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              </DetailsCard>
            ) : null}

            <DetailsCard title={t('shifts.orders.title')}>
              {renderOrders(detail.orders)}
            </DetailsCard>

            <DetailsCard title={t('shifts.expenses.title')}>
              {renderExpenses(detail.expenses)}
            </DetailsCard>
          </div>
        ) : null}
      </EntityDetailScreen>

      <CloseShiftModal
        shift={shift ?? null}
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSuccess={() => {
          setIsCloseModalOpen(false)
          void loadShift()
        }}
      />
    </>
  )
}
