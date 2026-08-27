export type LineFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'money'
  | 'date'
  | 'select'
  | 'lookup'
  | 'computed'
  | 'display'
  | 'badge'

export interface SelectOption {
  value: string
  label: string
}

export interface LineFieldContext<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  line: TLine
  lookups: TLookups
  locale: 'ar' | 'en'
  isNew?: boolean
  editingLineId?: string | null
  allLines?: TLine[]
}

export interface LineField<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  /** Stable schema identity for rendering, errors, and layout; distinct from data binding. */
  id: string
  key: keyof TLine & string
  labelKey: string // i18n key — never literal string (D12)
  type: LineFieldType
  required?: boolean
  readOnly?: boolean | ((ctx: LineFieldContext<TLine, TLookups>) => boolean)
  showIn?: Array<'grid' | 'form'> // default: ['grid', 'form']
  tableWidth?: string // Percentage width e.g. '28%'
  columnClass?: string // CSS column class name
  dir?: 'ltr' | 'rtl'
  step?: string | number
  min?: number

  // Field dependencies and cascading reset
  dependsOn?: Array<keyof TLine & string>
  onDependencyChange?: (
    newValue: unknown,
    ctx: LineFieldContext<TLine, TLookups>,
  ) => Partial<TLine>

  // Dynamic calculations vs Server display
  compute?: (ctx: LineFieldContext<TLine, TLookups>) => unknown
  format?: (value: unknown, ctx: LineFieldContext<TLine, TLookups>) => string

  // Validation returning errorCode
  validate?: (
    value: unknown,
    ctx: LineFieldContext<TLine, TLookups>,
  ) => string | null

  // Option providers for select / lookup fields
  options?: (ctx: LineFieldContext<TLine, TLookups>) => SelectOption[]
}

export interface LineAction<TLine = Record<string, unknown>> {
  key: string
  labelKey: string
  icon: string // Lucide icon name ('Pencil', 'Trash2', 'Wrench', 'PackageX')
  variant?: 'default' | 'danger' | 'confirm' | 'cancel'
  disabled?: (line: TLine) => boolean
  disabledReasonKey?: string | ((line: TLine) => string | undefined)
  onClick: (line: TLine) => void
}

export interface LineSchema<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  fields: LineField<TLine, TLookups>[]
  actions: LineAction<TLine>[]
  tableClassName?: string
  actionsIconOnly?: boolean
}

export interface LineSchemaDeps<
  TLine = Record<string, unknown>,
  TLookups = Record<string, unknown>,
> {
  lookups: TLookups
  locale: 'ar' | 'en'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: any, params?: any) => string
  handlers: {
    onEditLine?: (line: TLine) => void
    onDeleteLine?: (line: TLine) => void
    onMaintenanceLine?: (line: TLine) => void
    onDisposeLine?: (line: TLine) => void
  }
}
