import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ListCard,
  ListCardHeader,
  ListPageStates,
  ListToolbarSearch,
} from '../../components/ui/ListPage'
import { ListPagination } from '../../components/ui/ListPagination'
import {
  ClickableTableRow,
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../components/ui/Table'
import { useTranslation } from '../../i18n/useTranslation'
import * as customerService from '../../services/customerService'
import type { CustomerResponse } from '../../types/customer'
import { translateApiError } from '../../utils/errors'

const PAGE_SIZE = 20

export function CustomersListSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const hasSearch = search.trim().length > 0

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await customerService.getCustomers({
        search: search.trim() || undefined,
        page,
        size: PAGE_SIZE,
      })
      setCustomers(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setCustomers([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 300)
    return () => window.clearTimeout(timer)
  }, [loadCustomers])

  useEffect(() => {
    setPage(0)
  }, [search])

  function openCustomerOrders(customer: CustomerResponse) {
    const params = new URLSearchParams({
      customerId: String(customer.id),
      customerName: customer.name,
    })
    navigate(`/orders/list?${params.toString()}`)
  }

  const showEmpty = !loading && !error && customers.length === 0 && !hasSearch
  const showFilterEmpty = !loading && !error && customers.length === 0 && hasSearch
  const showTable = !loading && !error && customers.length > 0

  return (
    <>
      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('customers.list.title')}
          toolbar={
            <div className="orders-toolbar customers-toolbar">
              <ListToolbarSearch
                value={search}
                onChange={setSearch}
                placeholder={t('customers.search.placeholder')}
                ariaLabel={t('customers.search.aria')}
              />
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('customers.list.loading')}
          loadingColumns={2}
          showEmpty={showEmpty}
          emptyTitle={t('customers.empty.title')}
          emptyDescription={t('customers.empty.subtitle')}
          showFilterEmpty={showFilterEmpty}
          filterEmptyTitle={t('customers.noResults.title')}
          filterEmptyDescription={t('customers.noResults.subtitle')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th>{t('customers.col.name')}</Th>
                  <Th className="table-cell--numeric">{t('customers.col.phone')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <ClickableTableRow
                    key={customer.id}
                    onClick={() => openCustomerOrders(customer)}
                  >
                    <Td>{customer.name}</Td>
                    <Td className="table-cell--numeric" dir="ltr">
                      {customer.phone}
                    </Td>
                  </ClickableTableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />

        {showTable ? (
          <ListPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            disabled={loading}
          />
        ) : null}
      </ListCard>
    </>
  )
}
