import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useSearchParams } from 'react-router-dom'
import type { LineFieldContext, LineSchema } from '../types/lineSchema'
import { getApiErrorDetails } from '../utils/errors'

export type LineOpResult<TLine> =
  | { ok: true; line: TLine }
  | { ok: false; kind: 'validation' }
  | {
      ok: false
      kind: 'api'
      errorCode: string
      params?: Record<string, unknown>
    }

export interface UseDocumentLinesOptions<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  schema: LineSchema<TLine, TLookups>
  initialLines?: TLine[]
  linesReady?: boolean
  lookups: TLookups
  locale: 'ar' | 'en'
  t: (key: string, params?: Record<string, string | number>) => string
  onAddLine: (payload: unknown) => Promise<TLine[]>
  onUpdateLine: ((lineId: string | number, payload: unknown) => Promise<TLine[]>) | null
  onDeleteLine: (lineId: string | number) => Promise<TLine[]>
}

export function useDocumentLines<
  TLine extends { id?: string | number } = Record<string, unknown>,
  TLookups = Record<string, unknown>,
>({
  schema,
  initialLines = [],
  linesReady = true,
  lookups,
  locale,
  t,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
}: UseDocumentLinesOptions<TLine, TLookups>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam: 'form' | 'grid' = searchParams.get('view') === 'form' ? 'form' : 'grid'
  const lineParam = searchParams.get('line')

  const [lines, setLines] = useState<TLine[]>(initialLines)
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editLineForm, setEditLineForm] = useState<Partial<TLine> | null>(null)
  const [addingLine, setAddingLine] = useState(false)
  const [newLineForm, setNewLineForm] = useState<Partial<TLine> | null>(null)
  const [lineSaving, setLineSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ lineError?: string }>({})
  const [lineDirty, setLineDirty] = useState(false)
  const mutationInFlightRef = useRef(false)
  const lastInitialLinesRef = useRef(initialLines)
  const pendingInitialLinesRef = useRef<TLine[] | null>(null)
  const fallbackSelectionIndexRef = useRef<number | null>(null)

  const beginMutation = useCallback(() => {
    if (mutationInFlightRef.current) return false
    mutationInFlightRef.current = true
    setLineSaving(true)
    return true
  }, [])

  const finishMutation = useCallback(() => {
    mutationInFlightRef.current = false
    setLineSaving(false)
  }, [])

  const lineActionActive = addingLine || editingLineId !== null || lineSaving

  useEffect(() => {
    if (initialLines === lastInitialLinesRef.current) return
    lastInitialLinesRef.current = initialLines
    if (lineActionActive) {
      pendingInitialLinesRef.current = initialLines
      return
    }
    setLines(initialLines)
  }, [initialLines, lineActionActive])

  useEffect(() => {
    if (lineActionActive || pendingInitialLinesRef.current === null) return
    setLines(pendingInitialLinesRef.current)
    pendingInitialLinesRef.current = null
  }, [lineActionActive])

  const selectedLineId = lineParam || (lines.length > 0 ? String(lines[0].id) : null)
  const selectedIndex = useMemo(() => {
    if (!selectedLineId) return -1
    return lines.findIndex((l) => String(l.id) === String(selectedLineId))
  }, [lines, selectedLineId])

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (!lineDirty) return false
        const currentView = new URLSearchParams(currentLocation.search).get('view')
        const nextView = new URLSearchParams(nextLocation.search).get('view')
        // Grid/Form toggles are safe because both render the same controller state.
        if (currentLocation.pathname === nextLocation.pathname && currentView !== nextView) {
          return false
        }
        return true
      },
      [lineDirty],
    ),
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(t('common.unsavedChanges'))) blocker.proceed()
    else blocker.reset()
  }, [blocker, t])

  useEffect(() => {
    if (!lineDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [lineDirty])

  useEffect(() => {
    if (!linesReady) return
    if (lines.length === 0) {
      if (!lineParam) return
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('line')
        return next
      }, { replace: true })
      fallbackSelectionIndexRef.current = null
      return
    }
    if (!lineParam || lines.some((line) => String(line.id) === lineParam)) return
    const fallbackIndex = Math.min(
      fallbackSelectionIndexRef.current ?? 0,
      lines.length - 1,
    )
    const fallbackId = lines[fallbackIndex]?.id
    if (fallbackId == null) return
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('line', String(fallbackId))
      return next
    }, { replace: true })
    fallbackSelectionIndexRef.current = null
  }, [lineParam, lines, linesReady, setSearchParams])

  const setViewMode = useCallback(
    (mode: 'grid' | 'form', targetLineId?: string | number | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (mode === 'form') {
            next.set('view', 'form')
            if (targetLineId != null) {
              next.set('line', String(targetLineId))
            } else if (selectedLineId) {
              next.set('line', String(selectedLineId))
            }
          } else {
            next.delete('view')
            next.delete('line')
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, selectedLineId],
  )

  const selectLine = useCallback(
    (lineId: string | number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', 'form')
        next.set('line', String(lineId))
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const buildContext = useCallback(
    (line: Partial<TLine>, isNew = false): LineFieldContext<TLine, TLookups> => ({
      line: line as TLine,
      lookups,
      locale,
      isNew,
      editingLineId,
      allLines: lines,
    }),
    [lookups, locale, editingLineId, lines],
  )

  const updateFormValue = useCallback(
    (key: keyof TLine & string, value: unknown, isNew = false) => {
      const formSetter = isNew ? setNewLineForm : setEditLineForm
      formSetter((prev) => {
        if (!prev) return prev
        const updated = { ...prev, [key]: value } as Partial<TLine>
        const ctx = buildContext(updated, isNew)

        // Cascade updates for dependent fields
        schema.fields.forEach((field) => {
          if (field.dependsOn?.includes(key) && field.onDependencyChange) {
            const patch = field.onDependencyChange(value, ctx)
            Object.assign(updated, patch)
          }
        })
        return updated
      })
      setFieldErrors({})
      setLineDirty(true)
    },
    [schema.fields, buildContext],
  )

  const validateForm = useCallback(
    (form: Partial<TLine>, isNew = false): string | null => {
      const ctx = buildContext(form, isNew)
      for (const field of schema.fields) {
        if (field.visible && !field.visible(ctx)) continue
        if (field.validate) {
          const val = (form as Record<string, unknown>)[field.key]
          const errorCode = field.validate(val, ctx)
          if (errorCode) {
            return t(errorCode)
          }
        }
      }
      return null
    },
    [schema.fields, buildContext, t],
  )

  const newLineValidationError = useMemo(
    () => (newLineForm ? validateForm(newLineForm, true) : null),
    [newLineForm, validateForm],
  )
  const startAddLine = useCallback((initialValues: Partial<TLine> = {}) => {
    setAddingLine(true)
    setNewLineForm(initialValues)
    setEditingLineId(null)
    setEditLineForm(null)
    setFieldErrors({})
    setLineDirty(false)
  }, [])

  const startEditLine = useCallback((line: TLine) => {
    setAddingLine(false)
    setNewLineForm(null)
    setEditingLineId(String(line.id))
    setEditLineForm({ ...line })
    setFieldErrors({})
    setLineDirty(false)
  }, [])

  const cancelLineAction = useCallback(() => {
    setAddingLine(false)
    setNewLineForm(null)
    setEditingLineId(null)
    setEditLineForm(null)
    setFieldErrors({})
    setLineDirty(false)
  }, [])

  const saveNewLine = useCallback(
    async (payloadBuilder?: (form: Partial<TLine>) => unknown): Promise<LineOpResult<TLine>> => {
      if (!newLineForm) return { ok: false, kind: 'validation' }
      const errorMsg = validateForm(newLineForm, true)
      if (errorMsg) {
        setFieldErrors({ lineError: errorMsg })
        return { ok: false, kind: 'validation' }
      }
      if (!beginMutation()) return { ok: false, kind: 'validation' }
      setFieldErrors({})
      try {
        const payload = payloadBuilder ? payloadBuilder(newLineForm) : newLineForm
        const updatedLines = await onAddLine(payload)
        const previousIds = new Set(lines.map((line) => String(line.id)))
        const addedLine =
          updatedLines.find((line) => line.id != null && !previousIds.has(String(line.id))) ??
          updatedLines[updatedLines.length - 1] ??
          (newLineForm as TLine)
        // The mutation response is newer than any snapshot received while it was in flight.
        pendingInitialLinesRef.current = null
        setLines(updatedLines)
        setAddingLine(false)
        setNewLineForm(null)
        setLineDirty(false)
        return { ok: true, line: addedLine }
      } catch (error) {
        return { ok: false, kind: 'api', ...getApiErrorDetails(error) }
      } finally {
        finishMutation()
      }
    },
    [newLineForm, validateForm, beginMutation, onAddLine, lines, finishMutation],
  )

  const saveEditLine = useCallback(
    async (
      lineId: string | number,
      payloadBuilder?: (form: Partial<TLine>) => unknown,
    ): Promise<LineOpResult<TLine>> => {
      if (!editLineForm) return { ok: false, kind: 'validation' }
      if (!onUpdateLine) return { ok: false, kind: 'validation' }
      const errorMsg = validateForm(editLineForm, false)
      if (errorMsg) {
        setFieldErrors({ lineError: errorMsg })
        return { ok: false, kind: 'validation' }
      }
      if (!beginMutation()) return { ok: false, kind: 'validation' }
      setFieldErrors({})
      try {
        const payload = payloadBuilder ? payloadBuilder(editLineForm) : editLineForm
        const updatedLines = await onUpdateLine(lineId, payload)
        const updatedLine =
          updatedLines.find((line) => String(line.id) === String(lineId)) ??
          ({ ...editLineForm, id: lineId } as TLine)
        pendingInitialLinesRef.current = null
        setLines(updatedLines)
        setEditingLineId(null)
        setEditLineForm(null)
        setLineDirty(false)
        return { ok: true, line: updatedLine }
      } catch (error) {
        return { ok: false, kind: 'api', ...getApiErrorDetails(error) }
      } finally {
        finishMutation()
      }
    },
    [editLineForm, validateForm, beginMutation, onUpdateLine, finishMutation],
  )

  const deleteLine = useCallback(
    async (lineId: string | number): Promise<LineOpResult<TLine>> => {
      const deletedLine = lines.find((line) => String(line.id) === String(lineId))
      if (!deletedLine || !beginMutation()) return { ok: false, kind: 'validation' }
      fallbackSelectionIndexRef.current = lines.findIndex(
        (line) => String(line.id) === String(lineId),
      )
      try {
        const updatedLines = await onDeleteLine(lineId)
        pendingInitialLinesRef.current = null
        setLines(updatedLines)
        if (editingLineId === String(lineId)) {
          setEditingLineId(null)
          setEditLineForm(null)
        }
        setLineDirty(false)
        return { ok: true, line: deletedLine }
      } catch (error) {
        return { ok: false, kind: 'api', ...getApiErrorDetails(error) }
      } finally {
        finishMutation()
      }
    },
    [lines, beginMutation, onDeleteLine, editingLineId, finishMutation],
  )

  return {
    lines,
    editingLineId,
    editLineForm,
    addingLine,
    newLineForm,
    lineSaving,
    fieldErrors,
    newLineValidationError,
    viewMode: viewParam,
    selectedLineId,
    selectedIndex,
    setViewMode,
    selectLine,
    startAddLine,
    startEditLine,
    cancelLineAction,
    updateFormValue,
    saveNewLine,
    saveEditLine,
    deleteLine,
  }
}
