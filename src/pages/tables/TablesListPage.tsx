import { Edit, MapPinned, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ManageSectionsModal } from '../../components/tables/ManageSectionsModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { StatusToggle } from '../../components/ui/StatusToggle'
import { useNotify } from '../../components/ui/NotificationContext'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
  ListToolbarSearch,
  StatusFilterSelect,
} from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import {
  DataTable,
  StopPropagationCell,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as tableSectionService from '../../services/tableSectionService'
import * as tableService from '../../services/tableService'
import type { BranchResponse } from '../../types/branch'
import type { RestaurantTable } from '../../types/table'
import type { TableSection } from '../../types/tableSection'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canManageTables, canViewTables } from '../../utils/tableAccess'
import { TableFormModal } from './TableFormModal'

type StatusFilter = 'all' | 'active' | 'inactive'
type SectionFilter = 'all' | 'none' | string

export function TablesListPage() {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const canView = canViewTables()
  const canManage = canManageTables()
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')
  const [sections, setSections] = useState<TableSection[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalTable, setModalTable] = useState<RestaurantTable | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [sectionsModalOpen, setSectionsModalOpen] = useState(false)
  const [rowActionId, setRowActionId] = useState<number | null>(null)

  const loadTables = useCallback(async () => {
    if (!branchId) {
      setTables([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await tableService.getTables({
        branchId,
        sectionId: sectionFilter !== 'all' && sectionFilter !== 'none' ? sectionFilter : undefined,
      })
      const normalizedSearch = search.trim().toLowerCase()
      const filtered = data.filter((table) => {
        const matchesSearch =
          !normalizedSearch ||
          table.name.toLowerCase().includes(normalizedSearch) ||
          (table.sectionName ?? '').toLowerCase().includes(normalizedSearch)
        const matchesSection = sectionFilter !== 'none' || table.sectionId == null
        const matchesStatus =
          statusFilter === 'all' || table.active === (statusFilter === 'active')
        return matchesSearch && matchesSection && matchesStatus
      })
      setTables(filtered)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setTables([])
    } finally {
      setLoading(false)
    }
  }, [branchId, search, sectionFilter, statusFilter, t])

  useEffect(() => {
    if (!canView) return
    void branchService.getBranches().then(setBranches).catch(() => setBranches([]))
  }, [canView])

  const loadSections = useCallback(async () => {
    if (!branchId) {
      setSections([])
      setSectionFilter('all')
      return
    }
    try {
      const data = await tableSectionService.getTableSections(branchId)
      setSections(data)
      setSectionFilter((current) =>
        current !== 'all' && current !== 'none' && !data.some((section) => String(section.id) === current)
          ? 'all'
          : current,
      )
    } catch (err) {
      setError(translateApiError(err, t).message)
      setSections([])
    }
  }, [branchId, t])

  useEffect(() => {
    if (!canView) return
    void loadSections()
  }, [canView, loadSections])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadTables(), 250)
    return () => window.clearTimeout(timer)
  }, [canView, loadTables])

  async function handleToggleStatus(table: RestaurantTable) {
    if (!canManage) return
    setRowActionId(table.id)
    try {
      if (table.active) {
        await tableService.deactivateTable(table.id)
        notify.success(t('tables.toast.deactivateSuccess'))
      } else {
        await tableService.activateTable(table.id)
        notify.success(t('tables.toast.activateSuccess'))
      }
      await loadTables()
    } catch {
      // Mutation errors are translated by the global axios interceptor.
    } finally {
      setRowActionId(null)
    }
  }

  if (!canView) {
    return (
      <ListPage className="tables-page">
        <PageHeader title={t('tables.title')} description={t('tables.accessDenied')} />
      </ListPage>
    )
  }

  const branchLabel = (table: RestaurantTable) => {
    const branch = branches.find((item) => item.id === table.branchId)
    if (branch) return getLocalizedBranchName(branch, locale)
    return table.branchName ?? t('common.empty.dash')
  }

  const selectedBranch = branches.find((branch) => String(branch.id) === branchId)
  const selectedBranchName = selectedBranch ? getLocalizedBranchName(selectedBranch, locale) : ''

  return (
    <ListPage className="tables-page">
      <PageHeader
        title={t('tables.title')}
        description={t('tables.subtitle')}
        action={
          canManage ? (
            <div className="tables-page__actions">
              <Link className="button-secondary tables-page__layout-link" to="/tables/layout">
                <MapPinned size={16} />
                {t('tables.layout.open')}
              </Link>
              <ListPrimaryAction
                label={t('tables.actions.add')}
                onClick={() => {
                  setModalTable(null)
                  setModalOpen(true)
                }}
              />
            </div>
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('tables.listTitle')}
          toolbar={
            <>
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('common.search')}
                ariaLabel={t('common.search')}
              />
              <SelectFilter
                value={branchId}
                onChange={(value) => {
                  setBranchId(value)
                  setSectionFilter('all')
                }}
                options={[
                  { value: '', label: t('tables.form.selectBranch') },
                  ...branches.filter((branch) => branch.active).map((branch) => ({
                    value: String(branch.id),
                    label: getLocalizedBranchName(branch, locale),
                  })),
                ]}
                ariaLabel={t('tables.fields.branch')}
              />
              {branchId ? (
                <>
                  <SelectFilter
                    value={sectionFilter}
                    onChange={setSectionFilter}
                    options={[
                      { value: 'all', label: t('tables.filters.allSections') },
                      { value: 'none', label: t('tables.filters.noSection') },
                      ...sections.map((section) => ({
                        value: String(section.id),
                        label: locale === 'ar' ? section.nameAr || section.name : section.name,
                      })),
                    ]}
                    ariaLabel={t('tables.fields.section')}
                  />
                  {canManage ? (
                    <Button variant="secondary" onClick={() => setSectionsModalOpen(true)}>
                      <Settings size={16} />
                      {t('tables.sections.manage')}
                    </Button>
                  ) : null}
                </>
              ) : null}
              <StatusFilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel={t('common.status')}
              />
            </>
          }
        />
        <ListPageStates
          loading={loading}
          loadingMessage={t('tables.loading')}
          loadingColumns={5}
          showEmpty={!loading && !error && tables.length === 0}
          emptyTitle={branchId ? t('tables.empty.title') : t('tables.empty.selectBranchTitle')}
          emptyDescription={branchId ? t('tables.empty.subtitle') : t('tables.empty.selectBranchSubtitle')}
          emptyActionLabel={branchId && canManage ? t('tables.actions.add') : undefined}
          onEmptyAction={branchId && canManage ? () => setModalOpen(true) : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={!loading && !error && tables.length > 0}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th>{t('tables.fields.name')}</Th>
                  <Th>{t('tables.fields.branch')}</Th>
                  <Th>{t('tables.fields.section')}</Th>
                  <Th>{t('tables.fields.capacity')}</Th>
                  <Th>{t('common.status')}</Th>
                  <Th>{t('common.actions')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {tables.map((table) => {
                  const busy = rowActionId === table.id
                  return (
                    <TableRow key={table.id}>
                      <Td>{table.name}</Td>
                      <Td>{branchLabel(table)}</Td>
                      <Td>{table.sectionName || t('common.empty.dash')}</Td>
                      <Td>{table.capacity ?? t('common.empty.dash')}</Td>
                      <StopPropagationCell>
                        {canManage ? (
                          <StatusToggle
                            active={table.active}
                            disabled={busy}
                            entityName={table.name}
                            onToggle={() => void handleToggleStatus(table)}
                          />
                        ) : (
                          <Badge variant={table.active ? 'success' : 'inactive'}>
                            {table.active
                              ? t('common.status.active')
                              : t('common.status.inactive')}
                          </Badge>
                        )}
                      </StopPropagationCell>
                      <Td>
                        {canManage ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setModalTable(table)
                              setModalOpen(true)
                            }}
                          >
                            <Edit size={16} />
                            {t('common.edit')}
                          </Button>
                        ) : null}
                      </Td>
                    </TableRow>
                  )
                })}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>

      <TableFormModal
        open={modalOpen}
        mode={modalTable ? 'edit' : 'create'}
        table={modalTable}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          notify.success(modalTable ? t('tables.toast.updateSuccess') : t('tables.toast.createSuccess'))
          void loadTables()
        }}
      />
      <ManageSectionsModal
        open={sectionsModalOpen}
        branchId={branchId}
        branchName={selectedBranchName}
        onClose={() => setSectionsModalOpen(false)}
        onChanged={() => {
          void loadSections()
          void loadTables()
        }}
      />
    </ListPage>
  )
}
