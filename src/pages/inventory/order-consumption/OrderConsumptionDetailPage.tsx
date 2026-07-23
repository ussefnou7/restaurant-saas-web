import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, CircleAlert, Minus, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { DetailsCard } from '../../../components/fields'
import { DetailTabPanel, DetailTabs } from '../../../components/entity-detail/DetailTabs'
import { EntityDetailScreen } from '../../../components/entity-detail/EntityDetailScreen'
import { OrderConsumptionStatusBadge } from '../../../components/inventory/OrderConsumptionStatusBadge'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { useNotify } from '../../../components/ui/NotificationContext'
import {
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as orderConsumptionService from '../../../services/orderConsumptionService'
import * as userService from '../../../services/userService'
import type {
  OrderConsumptionDocDetailResponse,
  OrderConsumptionMaterialsSummaryResponse,
} from '../../../types/orderConsumption'
import type { UserResponse } from '../../../types/user'
import { canManageInventoryStock } from '../../../utils/inventoryAccess'
import { translateApiError } from '../../../utils/errors'
import { formatDate, formatDateTime } from '../../../utils/format'
import { StockAccessDenied } from '../StockAccessDenied'
import '../../../styles/order-consumption.css'

const TAB_DETAILS = 'details'
const TAB_MATERIALS = 'materials'

function formatDecimalString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const text = String(value)
  if (!text.includes('.')) return text
  return text.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
}

export function OrderConsumptionDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const notify = useNotify()
  const canManage = canManageInventoryStock()
  const [doc, setDoc] = useState<OrderConsumptionDocDetailResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [usersError, setUsersError] = useState('')
  const [activeTab, setActiveTab] = useState(TAB_DETAILS)
  const [materialsSummary, setMaterialsSummary] =
    useState<OrderConsumptionMaterialsSummaryResponse | null>(null)
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsError, setMaterialsError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recalculating, setRecalculating] = useState(false)

  const tabs = useMemo(
    () => [
      { id: TAB_DETAILS, label: t('orderConsumption.tabs.details') },
      { id: TAB_MATERIALS, label: t('orderConsumption.tabs.materialsSummary') },
    ],
    [t],
  )

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.fullName]))
  }, [users])

  const loadDoc = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      setDoc(await orderConsumptionService.getOrderConsumptionDoc(id))
    } catch (err) {
      setDoc(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [id, t])

  const loadUsers = useCallback(async () => {
    setUsersError('')
    try {
      setUsers(await userService.getUsers())
    } catch (err) {
      setUsers([])
      setUsersError(translateApiError(err, t).message)
    }
  }, [t])

  const loadMaterialsSummary = useCallback(async () => {
    if (!id || materialsSummary || materialsLoading) return
    setMaterialsLoading(true)
    setMaterialsError('')
    try {
      setMaterialsSummary(await orderConsumptionService.getOrderConsumptionMaterialsSummary(id))
    } catch (err) {
      setMaterialsError(translateApiError(err, t).message)
    } finally {
      setMaterialsLoading(false)
    }
  }, [id, materialsLoading, materialsSummary, t])

  useEffect(() => {
    if (!canManage) return
    const timer = window.setTimeout(() => void loadDoc(), 0)
    return () => window.clearTimeout(timer)
  }, [canManage, loadDoc])

  useEffect(() => {
    if (!canManage) return
    void loadUsers()
  }, [canManage, loadUsers])

  useEffect(() => {
    if (activeTab === TAB_MATERIALS) {
      void loadMaterialsSummary()
    }
  }, [activeTab, loadMaterialsSummary])

  async function handleRecalculate() {
    if (!id) return
    setRecalculating(true)
    try {
      await orderConsumptionService.recalculateOrderConsumptionDoc(id)
      notify.success(t('orderConsumption.recalculateSuccess'))
      setMaterialsSummary(null)
      await loadDoc()
    } catch {
      // Mutation errors are translated by the global API interceptor.
    } finally {
      setRecalculating(false)
    }
  }

  if (!canManage) return <StockAccessDenied />

  function getReference(item: OrderConsumptionDocDetailResponse): string {
    return `${item.warehouseName} - ${formatDate(item.createdAt)}`
  }

  function getCreatedByName(userId: number): string {
    return userNameById.get(userId) ?? t('orderConsumption.lines.unknownUser', { id: userId })
  }

  const overview = doc ? (
    <div className="order-consumption-detail">
      <DetailsCard
        title={getReference(doc)}
        actions={
          <>
            {/* TODO: restrict to CONFLICT-only once out of testing phase */}
            <Button onClick={() => void handleRecalculate()} disabled={recalculating}>
              <RotateCcw size={16} aria-hidden />
              {recalculating
                ? t('orderConsumption.action.recalculating')
                : t('orderConsumption.action.recalculate')}
            </Button>
          </>
        }
      >
        <div className="order-consumption-detail__header-grid">
          <div className="order-consumption-detail__info">
            <span className="order-consumption-detail__label">
              {t('orderConsumption.col.reference')}
            </span>
            <span className="order-consumption-detail__value">{getReference(doc)}</span>
          </div>
          <div className="order-consumption-detail__info">
            <span className="order-consumption-detail__label">
              {t('orderConsumption.col.status')}
            </span>
            <span className="order-consumption-detail__value">
              <OrderConsumptionStatusBadge status={doc.status} />
            </span>
          </div>
          <div className="order-consumption-detail__info">
            <span className="order-consumption-detail__label">
              {t('orderConsumption.col.createdAt')}
            </span>
            <span className="order-consumption-detail__value" dir="ltr">
              {formatDateTime(doc.createdAt)}
            </span>
          </div>
          <div className="order-consumption-detail__info">
            <span className="order-consumption-detail__label">
              {t('orderConsumption.col.processedAt')}
            </span>
            <span className="order-consumption-detail__value" dir="ltr">
              {formatDateTime(doc.processedAt)}
            </span>
          </div>
        </div>
      </DetailsCard>

      {usersError ? <div className="page-error-banner">{usersError}</div> : null}

      <DetailTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        <DetailTabPanel id={TAB_DETAILS} active={activeTab === TAB_DETAILS}>
          {doc.status === 'CONFLICT' && doc.errorDetails ? (
            <section className="order-consumption-conflicts" aria-labelledby="order-consumption-conflicts-title">
              <div className="order-consumption-conflicts__header">
                <CircleAlert size={20} aria-hidden />
                <h2 id="order-consumption-conflicts-title" className="order-consumption-conflicts__title">
                  {t('orderConsumption.conflicts.title')}
                </h2>
              </div>
              <p className="order-consumption-conflicts__description">
                {t('orderConsumption.conflicts.description')}
              </p>
              {doc.errorDetails.length ? (
                <ul className="order-consumption-conflicts__list">
                  {doc.errorDetails.map((item, index) => (
                    <li
                      key={`${item.materialId}-${index}`}
                      className="order-consumption-conflicts__item"
                      title={item.exceptionClass}
                    >
                      <strong>{item.materialName}</strong>
                      <span>{item.message}</span>
                      <span className="order-consumption-conflicts__meta">
                        {item.exceptionClass}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="order-consumption-conflicts__empty">
                  {t('orderConsumption.conflicts.noDetails')}
                </p>
              )}
            </section>
          ) : null}

          <DetailsCard title={t('orderConsumption.detail.linesTitle')}>
            {doc.lines.length === 0 ? (
              <p className="order-consumption-detail__empty">
                {t('orderConsumption.detail.noLines')}
              </p>
            ) : (
              <div className="list-card-content table-wrap">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <Th>{t('orderConsumption.lines.orderId')}</Th>
                      <Th column="entity">{t('orderConsumption.lines.createdBy')}</Th>
                      <Th column="status">{t('orderConsumption.lines.consumed')}</Th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {doc.lines.map((line) => (
                      <TableRow key={line.id}>
                        <Td dir="ltr">#{line.orderId}</Td>
                        <Td column="entity">{getCreatedByName(line.createdBy)}</Td>
                        <Td column="status">
                          <span
                            className={`order-consumption-consumed order-consumption-consumed--${
                              line.consumed ? 'yes' : 'no'
                            }`}
                          >
                            {line.consumed ? (
                              <Check size={14} aria-hidden />
                            ) : (
                              <Minus size={14} aria-hidden />
                            )}
                            {line.consumed
                              ? t('orderConsumption.consumed.true')
                              : t('orderConsumption.consumed.false')}
                          </span>
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </div>
            )}
          </DetailsCard>
        </DetailTabPanel>

        <DetailTabPanel id={TAB_MATERIALS} active={activeTab === TAB_MATERIALS}>
          <DetailsCard title={t('orderConsumption.detail.materialsTitle')}>
            {materialsError ? <div className="page-error-banner">{materialsError}</div> : null}
            {materialsLoading ? (
              <LoadingState message={t('orderConsumption.materials.loading')} />
            ) : materialsSummary && materialsSummary.materials.length === 0 ? (
              <p className="order-consumption-detail__empty">
                {t('orderConsumption.detail.noMaterials')}
              </p>
            ) : materialsSummary ? (
              <div className="list-card-content table-wrap">
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <Th column="entity">{t('orderConsumption.materials.material')}</Th>
                      <Th>{t('orderConsumption.materials.totalQty')}</Th>
                      <Th>{t('orderConsumption.materials.unit')}</Th>
                      <Th>{t('orderConsumption.materials.orderCount')}</Th>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materialsSummary.materials.map((summary) => (
                      <TableRow key={`${summary.materialId}-${summary.uom}`}>
                        <Td column="entity">{summary.materialName}</Td>
                        <Td dir="ltr">{formatDecimalString(summary.totalQtyConsumed)}</Td>
                        <Td>{summary.uom}</Td>
                        <Td dir="ltr">{summary.orderCount}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </div>
            ) : null}
          </DetailsCard>
        </DetailTabPanel>
      </DetailTabs>
    </div>
  ) : null

  return (
    <EntityDetailScreen
      backTo="/inventory/order-consumption"
      backLabel={t('orderConsumption.detail.back')}
      loading={loading}
      loadingMessage={t('orderConsumption.loading')}
      notFound={!loading && !doc && !error}
      notFoundTitle={t('orderConsumption.detail.notFoundTitle')}
      notFoundMessage={t('orderConsumption.detail.notFoundMessage')}
      error={error}
      overview={overview}
    />
  )
}
