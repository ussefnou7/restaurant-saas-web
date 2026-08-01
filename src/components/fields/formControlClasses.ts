function joinClasses(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function formInputClassName(options?: { ltr?: boolean; code?: boolean; className?: string }) {
  return joinClasses(
    'field-box__input',
    options?.ltr && 'field-box__input--ltr',
    options?.code && 'field-box__input--code',
    options?.className,
  )
}

export function formTextareaClassName(options?: { ltr?: boolean; className?: string }) {
  return joinClasses(
    'field-box__textarea',
    options?.ltr && 'field-box__textarea--ltr',
    options?.className,
  )
}

export function formSelectClassName(options?: { ltr?: boolean; className?: string }) {
  return joinClasses(
    'field-box__select',
    options?.ltr && 'field-box__select--ltr',
    options?.className,
  )
}

export function formDropdownClassName(className?: string) {
  return joinClasses('dropdown--form', 'dropdown--field', className)
}
