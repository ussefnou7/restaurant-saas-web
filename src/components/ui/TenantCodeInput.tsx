import { useEffect, useMemo, useState } from 'react'
import { authService } from '../../services/authService'
import {
  buildPrefix,
  buildTenantPrefixedCode,
  extractCodeSuffix,
  normalizeCodeSuffix,
  normalizeTenantCode,
  type TenantEntityPrefix,
} from '../../utils/tenantCode'

interface TenantCodeInputProps {
  id: string
  label: string
  entityPrefix: TenantEntityPrefix | string
  value: string
  onChange: (fullCode: string) => void
  tenantCode?: string | null
  disabled?: boolean
  required?: boolean
  placeholder?: string
  helperText?: string
  tenantUnavailableText?: string
  error?: string
}

export function TenantCodeInput({
  id,
  label,
  entityPrefix,
  value,
  onChange,
  tenantCode: tenantCodeProp,
  disabled = false,
  required = false,
  placeholder = 'MAIN',
  helperText,
  tenantUnavailableText,
  error,
}: TenantCodeInputProps) {
  const tenantCode = useMemo(
    () => normalizeTenantCode(tenantCodeProp ?? authService.getTenantCode() ?? ''),
    [tenantCodeProp],
  )
  const [suffix, setSuffix] = useState('')

  useEffect(() => {
    setSuffix(extractCodeSuffix(value, tenantCode, entityPrefix))
  }, [value, tenantCode, entityPrefix])

  function handleSuffixChange(raw: string) {
    const normalizedSuffix = normalizeCodeSuffix(raw)
    setSuffix(normalizedSuffix)
    onChange(buildTenantPrefixedCode(tenantCode, entityPrefix, normalizedSuffix))
  }

  const prefixLabel = tenantCode ? buildPrefix(tenantCode, entityPrefix) : '—'

  return (
    <div className={`field-box field-box--form${error ? ' field-box--error' : ''}${disabled ? ' field-box--disabled' : ''}`}>
      <label htmlFor={id} className="field-box__label">
        {label}
      </label>
      <div className="field-box__body">
        <div
          className={`tenant-code-input${disabled ? ' tenant-code-input--disabled' : ''}`}
          dir="ltr"
        >
          <span className="tenant-code-input__prefix" aria-hidden="true">
            {prefixLabel}
          </span>
          <input
            id={id}
            type="text"
            className="tenant-code-input__suffix"
            value={suffix}
            onChange={(event) => handleSuffixChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled || !tenantCode}
            required={required}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={helperText ? `${id}-helper` : undefined}
          />
        </div>
        {helperText ? (
          <span id={`${id}-helper`} className="field-box__helper">
            {helperText}
          </span>
        ) : null}
        {!tenantCode && tenantUnavailableText ? (
          <span className="field-box__helper">{tenantUnavailableText}</span>
        ) : null}
        {error ? <span className="field-box__error">{error}</span> : null}
      </div>
    </div>
  )
}
