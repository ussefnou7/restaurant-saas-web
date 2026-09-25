import { AlertTriangle, Lock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DetailField, FieldGrid } from '../../components/fields'
import {
  DetailTabPanel,
  DetailTabs,
  type DetailTabItem,
} from '../../components/entity-detail'
import { DocumentBackButton } from '../../components/layout/DocumentLayout/DocumentBackButton'
import { CloseShiftModal } from '../../components/shifts/CloseShiftModal'
import {
  ForcedCloseBadge,
  ShiftExpenseStatusBadge,
  ShiftStatusBadge,
} from '../../components/shifts/ShiftBadges'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingRows } from '../../components/ui/LoadingRows'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as shiftService from '../../services/shiftService'
import type { BranchResponse } from '../../types/branch'
import type {
  ShiftDetailResponse,
  ShiftExpenseLine,
  ShiftOrderLine,
  ShiftOrderStatus,
  ShiftPaymentMethod,
} from '../../types/shift'
import { resolveBranchName } from '../../utils/branchDisplay'
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
const TAB_ORDERS = 'orders'
const TAB_EXPENSES = 'expenses'

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
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(TAB_ORDERS)

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
    void branchService.getBranches().then(setBranches).catch(() => setBranches([]))
  }, [loadShift])

  const shift = detail?.shift
  const title = shift ? t('shifts.detail.title', { id: shift.id }) : ''

  const badges = shift ? (
    <div className="shift-detail__badges">
      <ShiftStatusBadge status={shift.status} />
      <ForcedCloseBadge forcedClose={shift.forcedClose} />
    </div>
  ) : null

  const paymentBreakdown = useMemo(() => {
    if (!detail) return []
    return PAYMENT_METHODS.map((method) => ({
      method,
      amount: detail.salesByPaymentMethod?.[method],
    }))
  }, [detail])

  const tabs = useMemo<DetailTabItem[]>(() => {
    const ordersCount = detail?.orders?.length ?? 0
    const expensesCount = detail?.expenses?.length ?? 0
    return [
      {
        id: TAB_ORDERS,
        label: t('shifts.tabs.orders', { count: ordersCount }),
      },
      {
        id: TAB_EXPENSES,
        label: t('shifts.tabs.expenses', { count: expensesCount }),
      },
    ]
  }, [detail, t])

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
      <div className="list-card-content table-wrap">
        <DataTable>
          <TableHead>
            <TableRow>
              <Th column="entity">{t('shifts.orders.columns.orderNo')}</Th>
              <Th column="date">{t('shifts.orders.columns.orderDate')}</Th>
              <Th column="status">{t('shifts.orders.columns.status')}</Th>
              <Th>{t('shifts.orders.columns.paymentMethod')}</Th>
              <Th className="table-cell--numeric">
                {t('shifts.orders.columns.totalAmount')}
              </Th>
              <Th>{t('shifts.orders.columns.recordedBy')}</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <Td column="entity">
                  {order.orderNo ?? t('shifts.orders.orderFallback', { id: order.id })}
                </Td>
                <Td column="date" dir="ltr">
                  {formatDateTime(order.orderDate, locale)}
                </Td>
                <Td column="status">
                  <OrderStatusBadge status={order.status} />
                </Td>
                <Td>
                  {getShiftPaymentMethodLabel(order.paymentMethod, t)}
                </Td>
                <Td className="table-cell--numeric" dir="ltr">
                  {money(order.totalAmount)}
                </Td>
                <Td>
                  {order.createdByName ?? t('common.empty.dash')}
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
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
      <div className="list-card-content table-wrap">
        <DataTable>
          <TableHead>
            <TableRow>
              <Th column="date">{t('shifts.expenses.columns.expenseDate')}</Th>
              <Th>{t('shifts.expenses.columns.category')}</Th>
              <Th>{t('shifts.expenses.columns.description')}</Th>
              <Th>{t('shifts.expenses.columns.payee')}</Th>
              <Th className="table-cell--numeric">
                {t('shifts.expenses.columns.amount')}
              </Th>
              <Th column="status">{t('shifts.expenses.columns.status')}</Th>
              <Th>{t('shifts.expenses.columns.recordedBy')}</Th>
              <Th column="date">{t('shifts.expenses.columns.recordedAt')}</Th>
              <Th>{t('shifts.expenses.columns.late')}</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <Td column="date" dir="ltr">
                  {formatShiftBusinessDate(expense.expenseDate, locale)}
                </Td>
                <Td>
                  {expense.categoryName ?? t('common.empty.dash')}
                </Td>
                <Td>
                  {expense.description ?? t('common.empty.dash')}
                </Td>
                <Td>
                  {expense.payeeName ?? t('common.empty.dash')}
                </Td>
                <Td className="table-cell--numeric" dir="ltr">
                  {money(expense.amount)}
                </Td>
                <Td column="status">
                  <ShiftExpenseStatusBadge status={expense.status} />
                </Td>
                <Td>
                  {expense.recordedByName ?? t('common.empty.dash')}
                </Td>
                <Td column="date" dir="ltr">
                  {formatDateTime(expense.createdAt, locale)}
                </Td>
                <Td>
                  {expense.recordedAfterClose ? (
                    <span className="shifts-late-expense-tag" title={t('shifts.expenses.lateTitle')}>
                      <AlertTriangle size={14} aria-hidden />
                      {t('shifts.expenses.late')}
                    </span>
                  ) : (
                    t('shifts.expenses.onTime')
                  )}
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      </div>
    )
  }

  if (loading) {
    return (
      <main className="shift-detail-page">
        <LoadingRows columns={2} rows={4} />
      </main>
    )
  }

  if (!detail || !shift) {
    return (
      <main className="shift-detail-page">
        <div className="shift-detail__topbar">
          <DocumentBackButton to="/shifts" />
        </div>
        <EmptyState
          title={t('shifts.detail.notFound.title')}
          description={t('shifts.detail.notFound.description')}
        />
      </main>
    )
  }

  return (
    <main className="shift-detail-page">
      <div className="shift-detail__topbar">
        <div className="shift-detail__topbar-start">
          <DocumentBackButton to="/shifts" />
          <div className="shift-detail__heading">
            <h1>{title}</h1>
            {badges}
          </div>
        </div>
        <div className="shift-detail__topbar-actions">
          {shift.status === 'OPEN' && canClose ? (
            <Button variant="primary" onClick={() => setIsCloseModalOpen(true)}>
              <Lock size={16} aria-hidden />
              <span>{t('shifts.actions.close')}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <div className="page-error-banner">{error}</div> : null}

      {/* Top Master Card */}
      <div className="shift-detail__card">
        <div className="shift-detail__card-section">
          <FieldGrid columns={3}>
            <DetailField
              label={t('shifts.columns.cashier')}
              value={shift.cashierName ?? t('common.empty.dash')}
            />
            <DetailField
              label={t('shifts.columns.closedBy')}
              value={shift.closedByUserName ?? t('common.empty.dash')}
            />
            <DetailField
              label={t('shifts.columns.device')}
              value={shift.deviceName}
            />
            <DetailField
              label={t('shifts.columns.branch')}
              value={resolveBranchName(shift.branchId, branches, locale, { branchName: shift.branchName })}
            />
            <DetailField
              label={t('shifts.columns.businessDate')}
              value={formatShiftBusinessDate(shift.businessDate, locale)}
              dir="ltr"
            />
            <DetailField
              label={t('shifts.columns.duration')}
              value={formatShiftDuration(shift.durationMinutes, t)}
              dir="ltr"
            />
            <DetailField
              label={t('shifts.columns.openedAt')}
              value={formatDateTime(shift.openedAt, locale)}
              dir="ltr"
            />
            <DetailField
              label={t('shifts.columns.closedAt')}
              value={shift.closedAt ? formatDateTime(shift.closedAt, locale) : undefined}
              dir="ltr"
            />
          </FieldGrid>
        </div>

        {showVariance ? (
          <>
            <div className="shift-detail__divider" />
            <div className="shift-detail__card-section">
              <h3 className="shift-detail__section-title">{t('shifts.breakdown.title')}</h3>
              <FieldGrid columns={3}>
                <DetailField
                  label={t('shifts.breakdown.cashSales')}
                  value={money(detail.cashSales)}
                  dir="ltr"
                />
                <DetailField
                  label={t('shifts.breakdown.expensesAtClose')}
                  value={money(detail.expensesAtClose)}
                  dir="ltr"
                />
                <DetailField
                  label={t('shifts.breakdown.varianceAtClose')}
                  value={signedMoney(detail.shift.variance)}
                  dir="ltr"
                />
                <DetailField
                  label={t('shifts.breakdown.lateExpenses')}
                  value={money(detail.lateExpenses)}
                  dir="ltr"
                />
                <DetailField
                  label={t('shifts.breakdown.explainedVariance')}
                  value={signedMoney(detail.explainedVariance)}
                  dir="ltr"
                />
              </FieldGrid>
              <div className="shifts-payment-breakdown">
                {paymentBreakdown.map((item) => (
                  <div key={item.method} className="shifts-payment-breakdown__item">
                    <span>{getShiftPaymentMethodLabel(item.method, t)}</span>
                    <strong dir="ltr">{money(item.amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Sub Tabs for Orders & Drawer Expenses */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="sub"
        className="shift-detail__tabs"
      >
        <DetailTabPanel id={TAB_ORDERS} active={activeTab === TAB_ORDERS}>
          {renderOrders(detail.orders)}
        </DetailTabPanel>

        <DetailTabPanel id={TAB_EXPENSES} active={activeTab === TAB_EXPENSES}>
          {renderExpenses(detail.expenses)}
        </DetailTabPanel>
      </DetailTabs>

      <CloseShiftModal
        shift={shift ?? null}
        open={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSuccess={() => {
          setIsCloseModalOpen(false)
          void loadShift()
        }}
      />
    </main>
  )
}
