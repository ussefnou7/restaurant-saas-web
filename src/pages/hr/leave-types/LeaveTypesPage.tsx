import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { CompactDateCell } from '../../../components/ui/CompactDateCell'
import { EntityCell } from '../../../components/ui/EntityCell'
import { StatusToggle } from '../../../components/ui/StatusToggle'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as leaveTypeService from '../../../services/leaveTypeService'
import type { LeaveTypeResponse } from '../../../types/leaveType'
import { translateApiError } from '../../../utils/errors'
import { canManageLeaveTypes } from '../../../utils/hrAccess'
import {
  formatDecimalDays,
  getLocalizedLeaveTypeResponseName,
} from '../../../utils/leaveDisplay'
import { LeaveTypeFormModal } from './LeaveTypeFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

function matchesSearch(type: LeaveTypeResponse, query: string, locale: 'en' | 'ar'): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const name = getLocalizedLeaveTypeResponseName(type, locale)
  return [name, type.code, type.nameEn ?? '', type.nameAr ?? '', type.descriptionEn ?? '', type.descriptionAr ?? '']
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

export function LeaveTypesPage() {
  const { t, locale } = useTranslation()
  const canManage = canManageLeaveTypes()

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingType, setEditingType] = useState<LeaveTypeResponse | null>(null)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadLeaveTypes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await leaveTypeService.getLeaveTypes()
      setLeaveTypes(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadLeaveTypes()
  }, [loadLeaveTypes])

  const filtered = useMemo(() => {
    return leaveTypes.filter((type) => {
      if (!matchesSearch(type, search, locale)) return false
      if (statusFilter === 'active' && !type.active) return false
      if (statusFilter === 'inactive' && type.active) return false
      return true
    })
  }, [leaveTypes, search, statusFilter, locale])

  function openCreateModal() {
    setModalMode('create')
    setEditingType(null)
    setModalOpen(true)
  }

  function openEditModal(type: LeaveTypeResponse) {
    setModalMode('edit')
    setEditingType(type)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingType(null)
  }

  async function handleToggleStatus(type: LeaveTypeResponse) {
    setRowActionId(type.id)
    setError('')
    try {
      await leaveTypeService.updateLeaveTypeStatus(type.id, !type.active)
      await loadLeaveTypes()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && leaveTypes.length === 0
  const showFilterEmpty = !loading && !error && leaveTypes.length > 0 && filtered.length === 0
  const showTable = !loading && !error && filtered.length > 0

  return (
    <ListPage className="leave-types-page">
      <PageHeader
        title={t('leaveTypes.title')}
        description={t('leaveTypes.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction label={t('leaveTypes.actions.add')} onClick={openCreateModal} />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('leaveTypes.listTitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('common.search')}
                  ariaLabel={t('common.search')}
                />
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel={t('common.status')}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('leaveTypes.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('leaveTypes.empty.title')}
          emptyDescription={t('leaveTypes.empty.subtitle')}
          emptyActionLabel={canManage ? t('leaveTypes.actions.add') : undefined}
          onEmptyAction={canManage ? openCreateModal : undefined}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('leaveTypes.col.leaveType')}</Th>
                  <Th className="table-cell--numeric">{t('leaveTypes.col.defaultDays')}</Th>
                  <Th>{t('leaveTypes.col.paid')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('common.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((type) => {
                  const busy = rowActionId === type.id
                  const name = getLocalizedLeaveTypeResponseName(type, locale)

                  return (
                    <ClickableTableRow
                      key={type.id}
                      onClick={() => canManage && openEditModal(type)}
                    >
                      <Td column="entity">
                        <EntityCell name={name} code={type.code} compact />
                      </Td>
                      <Td dir="ltr" className="table-cell--numeric">{formatDecimalDays(type.defaultDays)}</Td>
                      <Td>
                        <Badge variant={type.paid ? 'success' : 'muted'}>
                          {type.paid
                            ? t('leaveTypes.fields.paidYes')
                            : t('leaveTypes.fields.paidNo')}
                        </Badge>
                      </Td>
                      <StopPropagationCell column="status">
                        {canManage ? (
                          <StatusToggle
                            active={type.active}
                            disabled={busy}
                            entityName={name}
                            onToggle={() => void handleToggleStatus(type)}
                          />
                        ) : (
                          <Badge variant={type.active ? 'success' : 'inactive'}>
                            {type.active ? t('common.status.active') : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                      <Td column="date">
                        {type.createdAt ? (
                          <CompactDateCell value={type.createdAt} />
                        ) : (
                          <span className="text-muted">{t('common.empty.dash')}</span>
                        )}
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <LeaveTypeFormModal
        open={modalOpen}
        mode={modalMode}
        leaveType={editingType}
        onClose={closeModal}
        onSuccess={() => void loadLeaveTypes()}
      />
    </ListPage>
  )
}
