import { RotateCw, Settings } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ManageSectionsModal } from '../../components/tables/ManageSectionsModal'
import { Button } from '../../components/ui/Button'
import { ListCard, ListCardHeader, ListPage } from '../../components/ui/ListPage'
import { PageHeader } from '../../components/ui/PageHeader'
import { SelectFilter } from '../../components/ui/SelectFilter'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as tableSectionService from '../../services/tableSectionService'
import * as tableService from '../../services/tableService'
import type { BranchResponse } from '../../types/branch'
import type { RestaurantTable, TableShape } from '../../types/table'
import type { TableSection } from '../../types/tableSection'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canManageTables, canViewTables } from '../../utils/tableAccess'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 700
const TABLE_SIZE = 84

type DragState = {
  tableId: number
  offsetX: number
  offsetY: number
}

const SHAPES: TableShape[] = ['ROUND', 'SQUARE', 'RECTANGLE']

export function TableLayoutPage() {
  const { t, locale } = useTranslation()
  const canView = canViewTables()
  const canManage = canManageTables()
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [sections, setSections] = useState<TableSection[]>([])
  const [branchId, setBranchId] = useState('')
  const [sectionId, setSectionId] = useState('none')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [sectionsModalOpen, setSectionsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        sectionId: sectionId !== 'none' ? sectionId : undefined,
      })
      setTables(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setTables([])
    } finally {
      setLoading(false)
    }
  }, [branchId, sectionId, t])

  useEffect(() => {
    if (!canView) return
    void branchService.getBranches()
      .then((data) => {
        setBranches(data)
        if (!branchId && data[0]) setBranchId(String(data[0].id))
      })
      .catch(() => setBranches([]))
  }, [branchId, canView])

  useEffect(() => {
    if (!canView) return
    void loadTables()
  }, [canView, loadTables])

  const loadSections = useCallback(async () => {
    if (!branchId) {
      setSections([])
      setSectionId('none')
      return
    }
    try {
      const data = await tableSectionService.getTableSections(branchId)
      setSections(data)
      setSectionId((current) =>
        current !== 'none' && !data.some((section) => String(section.id) === current)
          ? 'none'
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

  const visibleTables = tables.filter((table) =>
    sectionId === 'none' ? table.sectionId == null : String(table.sectionId) === sectionId,
  )
  const placed = visibleTables.filter((table) => table.posX != null && table.posY != null)
  const unplaced = visibleTables.filter((table) => table.posX == null || table.posY == null)
  const selected = tables.find((table) => table.id === selectedId) ?? null

  function pointerToCanvas(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH - TABLE_SIZE, (clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT - TABLE_SIZE, (clientY - rect.top) * scaleY)),
    }
  }

  const selectedBranch = branches.find((branch) => String(branch.id) === branchId)
  const selectedBranchName = selectedBranch ? getLocalizedBranchName(selectedBranch, locale) : ''

  function startDrag(table: RestaurantTable, clientX: number, clientY: number) {
    if (!canManage) return
    setSelectedId(table.id)
    const canvasPoint = pointerToCanvas(clientX, clientY)
    setDrag({
      tableId: table.id,
      offsetX: canvasPoint && table.posX != null ? canvasPoint.x - table.posX : TABLE_SIZE / 2,
      offsetY: canvasPoint && table.posY != null ? canvasPoint.y - table.posY : TABLE_SIZE / 2,
    })
  }

  async function persistLayout(table: RestaurantTable, x: number, y: number) {
    const previous = tables
    const nextTable = {
      ...table,
      posX: Number(x.toFixed(2)),
      posY: Number(y.toFixed(2)),
      shape: table.shape ?? 'SQUARE',
      rotation: table.rotation ?? 0,
    }
    setTables((current) => current.map((item) => (item.id === table.id ? nextTable : item)))
    try {
      await tableService.updateTableLayout(table.id, {
        posX: nextTable.posX,
        posY: nextTable.posY,
        rotation: nextTable.rotation,
        shape: nextTable.shape,
      })
    } catch (err) {
      setTables(previous)
      setError(translateApiError(err, t).message)
    }
  }

  useEffect(() => {
    if (!drag) return
    const activeDrag = drag

    function handleMove(event: PointerEvent) {
      const table = tables.find((item) => item.id === activeDrag.tableId)
      const point = pointerToCanvas(event.clientX, event.clientY)
      if (!table || !point) return
      setTables((current) =>
        current.map((item) =>
          item.id === table.id
            ? {
                ...item,
                posX: Number(Math.max(0, Math.min(CANVAS_WIDTH - TABLE_SIZE, point.x - activeDrag.offsetX)).toFixed(2)),
                posY: Number(Math.max(0, Math.min(CANVAS_HEIGHT - TABLE_SIZE, point.y - activeDrag.offsetY)).toFixed(2)),
              }
            : item,
        ),
      )
    }

    function handleUp() {
      const table = tables.find((item) => item.id === activeDrag.tableId)
      setDrag(null)
      if (table?.posX != null && table.posY != null) {
        void persistLayout(table, table.posX, table.posY)
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, tables])

  async function updateSelectedLayout(next: Partial<RestaurantTable>) {
    if (!selected || !canManage) return
    const updated = { ...selected, ...next }
    setTables((current) => current.map((table) => (table.id === selected.id ? updated : table)))
    try {
      await tableService.updateTableLayout(selected.id, {
        posX: updated.posX,
        posY: updated.posY,
        rotation: updated.rotation ?? 0,
        shape: updated.shape,
      })
    } catch (err) {
      setError(translateApiError(err, t).message)
      void loadTables()
    }
  }

  if (!canView) {
    return (
      <ListPage className="table-layout-page">
        <PageHeader title={t('tables.layout.title')} description={t('tables.accessDenied')} />
      </ListPage>
    )
  }

  return (
    <ListPage className="table-layout-page">
      <PageHeader title={t('tables.layout.title')} description={t('tables.layout.subtitle')} />
      {error ? <div className="page-error-banner">{error}</div> : null}
      <ListCard>
        <ListCardHeader
          title={t('tables.layout.editor')}
          toolbar={
            <>
              <SelectFilter
                value={branchId}
                onChange={(value) => {
                  setBranchId(value)
                  setSectionId('none')
                }}
                options={branches.map((branch) => ({
                  value: String(branch.id),
                  label: getLocalizedBranchName(branch, locale),
                }))}
                ariaLabel={t('tables.fields.branch')}
              />
              <SelectFilter
                value={sectionId}
                onChange={setSectionId}
                options={[
                  { value: 'none', label: t('tables.filters.noSection') },
                  ...sections.map((section) => ({
                    value: String(section.id),
                    label: locale === 'ar' ? section.nameAr || section.name : section.name,
                  })),
                ]}
                ariaLabel={t('tables.fields.section')}
              />
              {canManage ? (
                <Button variant="secondary" onClick={() => setSectionsModalOpen(true)} disabled={!branchId}>
                  <Settings size={16} />
                  {t('tables.sections.manage')}
                </Button>
              ) : null}
            </>
          }
        />
        <div className="table-layout">
          <aside className="table-layout__sidebar">
            <h3>{t('tables.layout.unplaced')}</h3>
            {loading ? <p>{t('tables.loading')}</p> : null}
            {!loading && unplaced.length === 0 ? <p>{t('tables.layout.noUnplaced')}</p> : null}
            {unplaced.map((table) => (
              <button
                key={table.id}
                type="button"
                className="table-layout__unplaced"
                onPointerDown={(event) => startDrag(table, event.clientX, event.clientY)}
              >
                {table.name}
              </button>
            ))}
          </aside>
          <div className="table-layout__canvas-wrap">
            <div
              ref={canvasRef}
              className="table-layout__canvas"
              dir="ltr"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            >
              {placed.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={[
                    'table-layout__table',
                    `table-layout__table--${table.shape.toLowerCase()}`,
                    selectedId === table.id ? 'table-layout__table--selected' : '',
                  ].join(' ')}
                  style={{
                    left: `${((table.posX ?? 0) / CANVAS_WIDTH) * 100}%`,
                    top: `${((table.posY ?? 0) / CANVAS_HEIGHT) * 100}%`,
                    transform: `rotate(${table.rotation ?? 0}deg)`,
                  }}
                  onClick={() => setSelectedId(table.id)}
                  onPointerDown={(event) => startDrag(table, event.clientX, event.clientY)}
                >
                  <span>{table.name}</span>
                </button>
              ))}
            </div>
          </div>
          <aside className="table-layout__inspector">
            <h3>{t('tables.layout.properties')}</h3>
            {selected ? (
              <>
                <strong>{selected.name}</strong>
                <label>
                  <span>{t('tables.layout.shape')}</span>
                  <select
                    value={selected.shape}
                    onChange={(event) =>
                      void updateSelectedLayout({ shape: event.target.value as TableShape })
                    }
                    disabled={!canManage}
                  >
                    {SHAPES.map((shape) => (
                      <option key={shape} value={shape}>
                        {t(`tables.shapes.${shape}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="secondary"
                  onClick={() =>
                    void updateSelectedLayout({ rotation: ((selected.rotation ?? 0) + 45) % 360 })
                  }
                  disabled={!canManage}
                >
                  <RotateCw size={16} />
                  {t('tables.layout.rotate')}
                </Button>
              </>
            ) : (
              <p>{t('tables.layout.selectTable')}</p>
            )}
          </aside>
        </div>
      </ListCard>
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
