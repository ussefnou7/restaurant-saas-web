import axios from 'axios'

/** Structured error body returned by the backend GlobalExceptionHandler. */
export interface ApiFieldError {
  field: string
  errorCode: string
  params?: Record<string, unknown> | null
}

export interface ApiErrorResponse {
  errorCode?: string | null
  /** English debug text — for logs only, never rendered to the user. */
  message?: string | null
  params?: Record<string, unknown> | null
  status?: number
  timestamp?: string
  path?: string
  fieldErrors?: ApiFieldError[] | null
}

export interface TranslatedApiError {
  /** User-facing translated message, ready for notify.error(...) or inline display. */
  message: string
  /** Present for validation errors: form field name → translated message. */
  fieldErrors?: Record<string, string>
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function extractApiErrorBody(error: unknown): ApiErrorResponse | null {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') return data as ApiErrorResponse
    return null
  }
  if (typeof error === 'object' && error !== null) {
    if ('response' in error) {
      const data = (error as { response?: { data?: unknown } }).response?.data
      if (data && typeof data === 'object') return data as ApiErrorResponse
      return null
    }
    // Allow passing an already-parsed ApiErrorResponse body directly.
    if ('errorCode' in error || 'fieldErrors' in error) {
      return error as ApiErrorResponse
    }
  }
  return null
}

function toTranslationValues(params: Record<string, unknown> | null | undefined): Record<string, string | number> {
  const values: Record<string, string | number> = {}
  if (!params) return values
  for (const [name, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue
    values[name] = typeof value === 'number' ? value : String(value)
  }
  return values
}

/**
 * Translate a lookup for `errors.${code}`; returns null when the key has no
 * translation (t() echoes the key back for unknown keys).
 */
function translateErrorCode(
  t: TranslateFn,
  code: string,
  params: Record<string, unknown> | null | undefined,
): string | null {
  const key = `errors.${code}`
  const translated = t(key, toTranslationValues(params))
  return translated === key ? null : translated
}

type FreezeConflict = { materialName?: unknown; conflictingCountCode?: unknown }

type ConsumedBatch = { materialName?: unknown; batchId?: unknown; consumedQuantity?: unknown }

type LinkedReturn = { returnCode?: unknown; returnId?: unknown }

function translateFreezeConflict(
  t: TranslateFn,
  params: Record<string, unknown> | null | undefined,
): string | null {
  const conflicts = params?.conflicts
  if (!Array.isArray(conflicts) || conflicts.length === 0) {
    return translateErrorCode(t, 'GENERIC_ERROR', null)
  }
  const header = translateErrorCode(t, 'FREEZE_CONFLICT', null)
  if (header === null) return null
  const lines = (conflicts as FreezeConflict[]).map((conflict) =>
    t('errors.FREEZE_CONFLICT.item', {
      materialName: String(conflict.materialName ?? ''),
      conflictingCountCode: String(conflict.conflictingCountCode ?? ''),
    }),
  )
  return [header, ...lines].join('\n')
}

function translateUnpostBlockedHasReturn(
  t: TranslateFn,
  params: Record<string, unknown> | null | undefined,
): string | null {
  const returns = params?.returns
  if (!Array.isArray(returns) || returns.length === 0) {
    return translateErrorCode(t, 'UNPOST_BLOCKED_HAS_RETURN', null)
  }
  const returnCodes = (returns as LinkedReturn[])
    .map((item) => String(item.returnCode ?? item.returnId ?? '').trim())
    .filter(Boolean)
    .join(', ')
  return translateErrorCode(t, 'UNPOST_BLOCKED_HAS_RETURN', { returnCodes })
}

function translateUnpostBlockedBatchConsumed(
  t: TranslateFn,
  params: Record<string, unknown> | null | undefined,
): string | null {
  const batches = params?.consumedBatches
  if (!Array.isArray(batches) || batches.length === 0) {
    return translateErrorCode(t, 'UNPOST_BLOCKED_BATCH_CONSUMED', null)
  }
  const header = translateErrorCode(t, 'UNPOST_BLOCKED_BATCH_CONSUMED', null)
  if (header === null) return null
  const lines = (batches as ConsumedBatch[]).map((batch) =>
    t('errors.UNPOST_BLOCKED_BATCH_CONSUMED.item', {
      materialName: String(batch.materialName ?? ''),
      batchId: String(batch.batchId ?? ''),
      consumedQuantity: String(batch.consumedQuantity ?? ''),
    }),
  )
  return [header, ...lines].join('\n')
}

function translateFieldErrors(
  t: TranslateFn,
  fieldErrors: ApiFieldError[],
): TranslatedApiError {
  const byField: Record<string, string> = {}
  for (const fieldError of fieldErrors) {
    const constraint = fieldError.params?.constraint
    byField[fieldError.field] =
      typeof constraint === 'string' && constraint.trim()
        ? t('errors.VALIDATION_FAILED.field', { constraint })
        : t('errors.VALIDATION_FAILED.fieldGeneric')
  }
  const summary = t('errors.VALIDATION_FAILED')
  const lines = Object.entries(byField).map(([field, message]) => `${field}: ${message}`)
  return {
    message: [summary, ...lines].join('\n'),
    fieldErrors: byField,
  }
}

/**
 * Translate a backend error into user-facing text via the errors.* i18n keys.
 * Never returns the raw backend `message` (English debug text) to the caller.
 *
 * Does not notify by itself — hand the result to notify.error(...) or render
 * it inline (forms can map `fieldErrors` onto their inputs).
 */
export function translateApiError(error: unknown, t: TranslateFn): TranslatedApiError {
  const body = extractApiErrorBody(error)

  if (body?.fieldErrors && body.fieldErrors.length > 0) {
    return translateFieldErrors(t, body.fieldErrors)
  }

  if (body?.errorCode) {
    const translated =
      body.errorCode === 'FREEZE_CONFLICT'
        ? translateFreezeConflict(t, body.params)
        : body.errorCode === 'UNPOST_BLOCKED_HAS_RETURN'
          ? translateUnpostBlockedHasReturn(t, body.params)
          : body.errorCode === 'UNPOST_BLOCKED_BATCH_CONSUMED'
            ? translateUnpostBlockedBatchConsumed(t, body.params)
            : translateErrorCode(t, body.errorCode, body.params)
    if (translated !== null) {
      return { message: translated }
    }
    console.error(
      `[api] Unmapped errorCode "${body.errorCode}": ${body.message ?? '(no message)'}`,
      error,
    )
    return { message: t('errors.GENERIC_ERROR') }
  }

  // Network failure or a non-structured error body.
  console.error('[api] Unstructured API error:', error)
  return { message: t('errors.GENERIC_ERROR') }
}

/** Typed access to the backend `errorCode` on an axios (or parsed) error body. */
export function getApiErrorCode(error: unknown): string | undefined {
  const code = extractApiErrorBody(error)?.errorCode
  return typeof code === 'string' && code.trim() ? code : undefined
}

export function isForbiddenError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 403
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const status = (error as { response?: { status?: number } }).response?.status
    return status === 403
  }

  return false
}