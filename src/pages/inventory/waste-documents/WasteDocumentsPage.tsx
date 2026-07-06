import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import {
  ListCard,
  ListCardHeader,
  ListPage,
  ListPageStates,
  ListPrimaryAction,
} from '../../../components/ui/ListPage'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SelectFilter } from '../../../components/ui/SelectFilter'
import {
  ClickableTableRow,
  DataTable,
  TableBody,
  TableHead,
  TableRow,
  Td,
  Th,
} from '../../../components/ui/Table'
import { useTranslation } from '../../../i18n/useTranslation'
import * as wasteDocumentService from '../../../services/wasteDocumentService'
import type { DocumentStatus, WasteDocumentResponse } from '../../../types/wasteDocument'
import { translateApiError } from '../../../utils/errors'
import { formatDate } from '../../../utils/format'
import { canManageInventoryStock, canViewInventoryStock } from '../../../utils/inventoryAccess'
import { getInventoryLocalizedName } from '../../../utils/inventoryDisplay'
import { StockAccessDenied } from '../StockAccessDenied'
import { useStockFilterLookups } from '../useStockFilterLookups'

function getStatusVariant(status: DocumentStatus): 'muted' | 'warning' | 'success' {
  switch (status) {
    case 'DRAFT':
    case 'CANCELLED':
      return 'muted'
    case 'COMPLETE':
      return 'warning'
    case 'POSTED':
      return 'success'
    default:
      return 'muted'
  }
}

export function WasteDocumentsPage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const canView = canViewInventoryStock()
  const canManage = canManageInventoryStock()
  const { warehouses } = useStockFilterLookups()

  const [documents, setDocuments] = useState<WasteDocumentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await wasteDocumentService.getWasteDocuments({
        warehouseId: warehouseFilter || undefined,
      })
      setDocuments(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [t, warehouseFilter])

  useEffect(() => {
    if (!canView) return
    const timer = window.setTimeout(() => void loadDocuments(), 300)
    return () => window.clearTimeout(timer)
  }, [canView, loadDocuments])

  if (!canView) return <StockAccessDenied />

  const showEmpty = !loading && !error && documents.length === 0
  const showTable = !loading && !error && documents.length > 0

  const warehouseOptions = [
    { value: '', label: t('inventory.common.allWarehouses') },
    ...warehouses.map((warehouse) => ({
      value: String(warehouse.id),
      label: getInventoryLocalizedName(warehouse, locale),
    })),
  ]

  return (
    <ListPage className="waste-documents-page">
      <PageHeader
        title={t('inventory.waste.title')}
        description={t('inventory.waste.subtitle')}
        action={
          canManage ? (
            <ListPrimaryAction
              label={t('inventory.waste.add')}
              onClick={() => navigate('/inventory/waste-documents/new')}
            />
          ) : undefined
        }
      />

      {error ? <div className="page-error-banner">{error}</div> : null}

      <ListCard>
        <ListCardHeader
          title={t('inventory.waste.listTitle')}
          toolbar={
            <div className="waste-documents-toolbar">
              <SelectFilter
                value={warehouseFilter}
                onChange={setWarehouseFilter}
                options={warehouseOptions}
                ariaLabel={t('inventory.waste.filter.warehouse')}
              />
            </div>
          }
        />

        <ListPageStates
          loading={loading}
          loadingMessage={t('inventory.waste.loading')}
          loadingColumns={6}
          showEmpty={showEmpty}
          emptyTitle={t('inventory.waste.empty.title')}
          emptyDescription={t('inventory.waste.empty.subtitle')}
          emptyActionLabel={canManage ? t('inventory.waste.add') : undefined}
          onEmptyAction={canManage ? () => navigate('/inventory/waste-documents/new') : undefined}
          showFilterEmpty={false}
          filterEmptyTitle={t('common.noResults')}
          filterEmptyDescription={t('common.tryAdjustFilters')}
          showTable={showTable}
          table={
            <DataTable>
              <TableHead>
                <TableRow>
                  <Th className="table-cell--numeric">{t('inventory.waste.col.code')}</Th>
                  <Th column="entity">{t('inventory.waste.col.warehouse')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.waste.col.wasteDate')}</Th>
                  <Th>{t('inventory.waste.col.reason')}</Th>
                  <Th column="status">{t('inventory.waste.col.status')}</Th>
                  <Th className="table-cell--numeric">{t('inventory.waste.col.lineCount')}</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <ClickableTableRow
                    key={doc.id}
                    onClick={() => navigate(`/inventory/waste-documents/${doc.id}`)}
                  >
                    <Td dir="ltr" className="table-cell--numeric">
                      <span className="waste-document-code">{doc.code}</span>
                    </Td>
                    <Td column="entity">{doc.warehouseName}</Td>
                    <Td dir="ltr" className="table-cell--numeric">{formatDate(doc.wasteDate)}</Td>
                    <Td>{t(`inventory.waste.reasonCode.${doc.reasonCode}`)}</Td>
                    <Td column="status">
                      <Badge variant={getStatusVariant(doc.status)}>
                        {t(`inventory.waste.status.${doc.status}`)}
                      </Badge>
                    </Td>
                    <Td dir="ltr" className="table-cell--numeric">{doc.lines?.length ?? 0}</Td>
                  </ClickableTableRow>
                ))}
              </TableBody>
            </DataTable>
          }
        />
      </ListCard>
    </ListPage>
  )
}
