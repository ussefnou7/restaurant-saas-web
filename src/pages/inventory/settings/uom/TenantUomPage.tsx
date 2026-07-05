import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../../../components/ui/Badge'
import { ConfirmModal } from '../../../../components/ui/ConfirmModal'
import { EntityCell } from '../../../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
} from '../../../../components/ui/ListPage'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { RowActionGroup } from '../../../../components/ui/RowActions'
import { useNotify } from '../../../../components/ui/NotificationContext'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../../components/ui/Table'
import { useTranslation } from '../../../../i18n/useTranslation'
import * as uomService from '../../../../services/uomService'
import type { UomResponse } from '../../../../types/inventory'
import { translateApiError } from '../../../../utils/errors'
import { canViewInventorySetup } from '../../../../utils/inventoryAccess'
import { InventoryAccessDenied } from '../../InventoryAccessDenied'
import { getTenantUomTypeLabel, isGlobalUom } from './tenantUomDisplay'
import { TenantUomFormModal } from './TenantUomFormModal'

type PendingAction =
  | { type: 'deactivate'; uom: UomResponse }
  | { type: 'delete'; uom: UomResponse }

function isUomInUseError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    return status === 409 || status === 422
  }
  return false
}

function ActionSpinner() {
  return <span className="list-state__spinner" aria-hidden="true" />
}

export function TenantUomPage() {
  const { t } = useTranslation()
  const notify = useNotify()
  const canView = canViewInventorySetup()

  const [uoms, setUoms] = useState<UomResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const loadUoms = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await uomService.getTenantUoms()
      setUoms(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setUoms([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!canView) return
    void loadUoms()
  }, [canView, loadUoms])

  function handleAddSuccess(created: UomResponse) {
    setUoms((prev) => [...prev, created])
    notify.success('تمت إضافة وحدة القياس بنجاح')
  }

  async function handleConfirmAction() {
    if (!pendingAction) return

    setConfirmLoading(true)
    setRowActionId(pendingAction.uom.id)
    try {
      if (pendingAction.type === 'deactivate') {
        const updated = await uomService.deactivateTenantUom(pendingAction.uom.id)
        setUoms((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated, active: false } : item)),
        )
        notify.success('تم تعطيل وحدة القياس')
      } else {
        await uomService.deleteTenantUom(pendingAction.uom.id)
        setUoms((prev) => prev.filter((item) => item.id !== pendingAction.uom.id))
        notify.success('تم حذف وحدة القياس')
      }
      setPendingAction(null)
    } catch (err) {
      // Delete opts out of the global toast (notifyOnError: false) so we can
      // show a tailored hint; deactivate failures are toasted by the interceptor.
      if (pendingAction.type === 'delete') {
        if (isUomInUseError(err)) {
          setPendingAction(null)
          notify.error('لا يمكن حذف هذه الوحدة لأنها مستخدمة، يمكنك تعطيلها')
        } else {
          notify.error(translateApiError(err, t).message)
        }
      }
    } finally {
      setConfirmLoading(false)
      setRowActionId(null)
    }
  }

  if (!canView) return <InventoryAccessDenied />

  const showEmpty = !loading && !error && uoms.length === 0
  const showTable = !loading && !error && uoms.length > 0

  const confirmTitle =
    pendingAction?.type === 'deactivate' ? 'تعطيل وحدة القياس' : 'حذف وحدة القياس'
  const confirmMessage =
    pendingAction?.type === 'deactivate'
      ? 'هل أنت متأكد من تعطيل هذه الوحدة؟ لن تظهر في أي شاشة بعد الآن.'
      : 'هل أنت متأكد من حذف هذه الوحدة نهائياً؟'
  const confirmLabel = pendingAction?.type === 'deactivate' ? 'تعطيل' : 'حذف'

  return (
    <div dir="rtl">
      <ListPage className="tenant-uom-page">
      <PageHeader
        title="وحدات القياس"
        description="تشمل الوحدات العامة المتاحة لك ووحداتك المخصصة"
        action={
          <ListPrimaryAction label="+ إضافة وحدة مخصصة" onClick={() => setModalOpen(true)} />
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader title="قائمة وحدات القياس" />

        <ListPageStates
          loading={loading}
          loadingMessage="جاري تحميل وحدات القياس…"
          loadingColumns={6}
          showEmpty={showEmpty}
          emptyTitle="لا توجد وحدات قياس"
          emptyDescription="أضف وحدة مخصصة لتوسيع وحدات القياس المتاحة."
          emptyActionLabel="+ إضافة وحدة مخصصة"
          onEmptyAction={() => setModalOpen(true)}
          showFilterEmpty={false}
          filterEmptyTitle="لا توجد نتائج"
          filterEmptyDescription="جرّب تعديل عوامل التصفية"
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">الاسم</Th>
                  <Th>النوع</Th>
                  <Th>المصدر</Th>
                  <Th>معامل التحويل</Th>
                  <Th column="status">الحالة</Th>
                  <Th>الإجراءات</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {uoms.map((uom) => {
                  const global = isGlobalUom(uom.tenantId)
                  const busy = rowActionId === uom.id

                  return (
                    <TableRow key={uom.id} className={global ? 'table-row--global' : undefined}>
                      <Td column="entity">
                        <EntityCell
                          name={uom.nameAr?.trim() || uom.name}
                          code={uom.code}
                          compact
                        />
                      </Td>
                      <Td>{getTenantUomTypeLabel(uom.type)}</Td>
                      <Td>{global ? '🌐 عام' : '🏪 مخصص'}</Td>
                      <Td dir="ltr">{uom.factorToBase ?? '—'}</Td>
                      <StopPropagationCell column="status">
                        <Badge variant={uom.active ? 'success' : 'inactive'}>
                          {uom.active ? 'نشط' : 'معطل'}
                        </Badge>
                      </StopPropagationCell>
                      <StopPropagationCell>
                        {global ? null : (
                          <RowActionGroup>
                            {uom.active ? (
                              <button
                                type="button"
                                className="action-btn action-btn--status action-btn--deactivate"
                                disabled={busy}
                                onClick={() => setPendingAction({ type: 'deactivate', uom })}
                              >
                                {busy && pendingAction?.type === 'deactivate' ? (
                                  <ActionSpinner />
                                ) : (
                                  'تعطيل'
                                )}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="action-btn action-btn--danger"
                              disabled={busy}
                              onClick={() => setPendingAction({ type: 'delete', uom })}
                            >
                              {busy && pendingAction?.type === 'delete' ? (
                                <ActionSpinner />
                              ) : (
                                'حذف'
                              )}
                            </button>
                          </RowActionGroup>
                        )}
                      </StopPropagationCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <TenantUomFormModal
        open={modalOpen}
        uoms={uoms}
        onClose={() => setModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <ConfirmModal
        open={pendingAction != null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        loading={confirmLoading}
        loadingLabel={pendingAction?.type === 'deactivate' ? 'جاري التعطيل…' : 'جاري الحذف…'}
        onClose={() => {
          if (!confirmLoading) setPendingAction(null)
        }}
        onConfirm={() => void handleConfirmAction()}
      />
      </ListPage>
    </div>
  )
}
