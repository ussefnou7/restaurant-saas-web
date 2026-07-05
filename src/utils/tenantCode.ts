export const TENANT_ENTITY_PREFIXES = {
  BR: 'BR',
  JOB: 'JOB',
  EMP: 'EMP',
  USR: 'USR',
  UNT: 'UNT',
  CAT: 'CAT',
  MAT: 'MAT',
  MCAT: 'MCAT',
  WH: 'WH',
  SUP: 'SUP',
  PROD: 'PROD',
  UOM: 'UOM',
} as const

export type TenantEntityPrefix = (typeof TENANT_ENTITY_PREFIXES)[keyof typeof TENANT_ENTITY_PREFIXES]

export function normalizeTenantCode(tenantCode: string): string {
  return tenantCode.trim().toUpperCase()
}

export function normalizeEntityPrefix(entityPrefix: string): string {
  return entityPrefix.trim().toUpperCase()
}

export function normalizeCodeSuffix(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildPrefix(tenantCode: string, entityPrefix: string): string {
  const normalizedTenant = normalizeTenantCode(tenantCode)
  const normalizedEntityPrefix = normalizeEntityPrefix(entityPrefix)

  if (!normalizedTenant || !normalizedEntityPrefix) {
    return ''
  }

  return `${normalizedTenant}-${normalizedEntityPrefix}-`
}

export function buildTenantPrefixedCode(
  tenantCode: string,
  entityPrefix: string,
  suffix: string,
): string {
  const prefix = buildPrefix(tenantCode, entityPrefix)
  const normalizedSuffix = normalizeCodeSuffix(suffix)

  if (!prefix || !normalizedSuffix) {
    return ''
  }

  return `${prefix}${normalizedSuffix}`
}

export function extractCodeSuffix(
  fullCode: string,
  tenantCode: string,
  entityPrefix: string,
): string {
  const normalizedFullCode = fullCode.trim().toUpperCase()
  const expectedPrefix = buildPrefix(tenantCode, entityPrefix)

  if (!normalizedFullCode) {
    return ''
  }

  if (expectedPrefix && normalizedFullCode.startsWith(expectedPrefix)) {
    return normalizedFullCode.slice(expectedPrefix.length)
  }

  const normalizedTenant = normalizeTenantCode(tenantCode)
  if (normalizedTenant) {
    const tenantOnlyPrefix = `${normalizedTenant}-`
    if (normalizedFullCode.startsWith(tenantOnlyPrefix)) {
      return normalizedFullCode.slice(tenantOnlyPrefix.length)
    }
  }

  return normalizedFullCode
}
