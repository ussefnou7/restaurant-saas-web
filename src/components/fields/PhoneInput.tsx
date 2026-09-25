import type { ChangeEvent, InputHTMLAttributes } from 'react'
import { normalizePhone, PHONE_LENGTH } from '../../utils/phoneValidation'
import { FormInput } from './FormControls'

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  ltr?: boolean
  code?: boolean
}

export function PhoneInput({
  ltr = true,
  maxLength = PHONE_LENGTH,
  onChange,
  ...props
}: PhoneInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    const cleaned = normalizePhone(raw)
    event.target.value = cleaned
    onChange?.(event)
  }

  return (
    <FormInput
      type="tel"
      inputMode="numeric"
      pattern="01[0-9]{9}"
      maxLength={maxLength}
      ltr={ltr}
      onChange={handleChange}
      {...props}
    />
  )
}
