import { useTranslation } from '../../../i18n/useTranslation'
import type { DocumentStatus } from '../../../types/wasteDocument'

interface WasteDocumentStatusPillProps {
  status: DocumentStatus
}

export function WasteDocumentStatusPill({ status }: WasteDocumentStatusPillProps) {
  const { t } = useTranslation()

  return (
    <span className={`pi-form-status-pill pi-form-status-pill--${status.toLowerCase()}`}>
      {t(`inventory.waste.status.${status}`)}
    </span>
  )
}
