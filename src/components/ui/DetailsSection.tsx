import type { ReactNode } from 'react'
import { DetailField, FieldGrid, SectionGroup } from '../fields'

interface DetailsSectionProps {
  title: string
  children: ReactNode
}

export function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <SectionGroup title={title} divider={false}>
      <FieldGrid columns={2}>{children}</FieldGrid>
    </SectionGroup>
  )
}

interface DetailsFieldProps {
  label: string
  value: ReactNode
  ltr?: boolean
  fullWidth?: boolean
}

export function DetailsField({ label, value, ltr, fullWidth }: DetailsFieldProps) {
  return (
    <DetailField label={label} value={value} dir={ltr ? 'ltr' : undefined} fullWidth={fullWidth} />
  )
}
