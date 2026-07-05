import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompactStatCard } from '../../components/ui/StatCard'
import { CompactDateCell } from '../../components/ui/CompactDateCell'
import { EntityCell } from '../../components/ui/EntityCell'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListStatsGrid,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { StatusToggle } from '../../components/ui/StatusToggle'
import {
  ClickableTableRow,
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as userService from '../../services/userService'
import type { UserResponse } from '../../types/user'
import { translateApiError } from '../../utils/errors'
import { USER_ROLE_OPTIONS } from './userRoles'
import { UserFormModal } from './UserFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'

function matchesSearch(user: UserResponse, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    user.fullName,
    user.username,
    user.phone ?? '',
    user.role.name,
    user.role.code,
    user.branchName ?? '',
    user.branchCode ?? '',
  ]

  return haystack.some((field) => field.toLowerCase().includes(q))
}

export function UsersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!matchesSearch(user, search)) return false
      if (statusFilter === 'active' && !user.active) return false
      if (statusFilter === 'inactive' && user.active) return false
      if (roleFilter !== 'all' && user.role.code !== roleFilter) return false
      return true
    })
  }, [users, search, statusFilter, roleFilter])

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.active).length
    return { total, active, inactive: total - active }
  }, [users])

  function openCreateModal() {
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleToggleStatus(user: UserResponse) {
    setRowActionId(user.id)
    try {
      await userService.updateUserStatus(user.id, !user.active)
      await loadUsers()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  const showEmpty = !loading && !error && users.length === 0
  const showFilterEmpty = !loading && !error && users.length > 0 && filteredUsers.length === 0
  const showTable = !loading && !error && filteredUsers.length > 0

  return (
    <ListPage className="users-page">
      <PageHeader
        title={t('users.title')}
        description={t('users.subtitle')}
        action={<ListPrimaryAction label={t('users.add')} onClick={openCreateModal} />}
      />

      {!loading && !error ? (
        <ListStatsGrid>
          <CompactStatCard title={t('users.totalUsers')} value={stats.total} dotVariant="primary" />
          <CompactStatCard title={t('common.active')} value={stats.active} dotVariant="success" />
          <CompactStatCard title={t('common.inactive')} value={stats.inactive} dotVariant="warning" />
        </ListStatsGrid>
      ) : null}

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('users.listTitle')}
          subtitle={t('users.listSubtitle')}
          toolbar={
            !showEmpty ? (
              <>
                <ListToolbarSearch
                  value={search}
                  onChange={setSearch}
                  placeholder={t('users.searchPlaceholder')}
                  ariaLabel={t('common.search')}
                />
                <StatusFilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel={t('users.filterStatus')}
                />
                <SelectFilter
                  value={roleFilter}
                  onChange={setRoleFilter}
                  ariaLabel={t('users.filterRole')}
                  className="select-filter--role"
                  options={[
                    { value: 'all', label: t('common.allRoles') },
                    ...USER_ROLE_OPTIONS.map((role) => ({
                      value: role.code,
                      label: role.label,
                    })),
                  ]}
                />
              </>
            ) : undefined
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('users.loading')}
          loadingColumns={5}
          showEmpty={showEmpty}
          emptyTitle={t('users.emptyTitle')}
          emptyDescription={t('users.emptyText')}
          emptyActionLabel={t('users.add')}
          onEmptyAction={openCreateModal}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th column="entity">{t('users.col.user')}</Th>
                  <Th>{t('users.col.role')}</Th>
                  <Th>{t('users.col.branch')}</Th>
                  <Th column="status">{t('common.status')}</Th>
                  <Th column="date">{t('common.createdAt')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const busy = rowActionId === user.id
                  return (
                    <ClickableTableRow
                      key={user.id}
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <Td column="entity">
                        <EntityCell
                          name={user.fullName}
                          meta={`@${user.username}`}
                          compact
                        />
                      </Td>
                      <Td>
                        <span className="role-cell-name">{user.role.name || user.role.code}</span>
                      </Td>
                      <Td>
                        <span className="branch-cell-name">
                          {user.branchName ?? '—'}
                        </span>
                      </Td>
                      <StopPropagationCell column="status">
                        <StatusToggle
                          active={user.active}
                          disabled={busy}
                          entityName={user.fullName}
                          onToggle={() => void handleToggleStatus(user)}
                        />
                      </StopPropagationCell>
                      <Td column="date">
                        <CompactDateCell value={user.createdAt} />
                      </Td>
                    </ClickableTableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <UserFormModal
        open={modalOpen}
        mode="create"
        user={null}
        onClose={closeModal}
        onSuccess={() => void loadUsers()}
      />
    </ListPage>
  )
}
