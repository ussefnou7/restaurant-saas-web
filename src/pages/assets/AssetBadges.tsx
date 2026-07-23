import { Badge } from '../../components/ui/Badge'
import { useTranslation } from '../../i18n/useTranslation'
import type { AssetStatus } from '../../types/assets'
import { getAssetStatusBadgeVariant, getAssetStatusLabel } from '../../utils/assetDisplay'

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const { t } = useTranslation()
  return <Badge variant={getAssetStatusBadgeVariant(status)}>{getAssetStatusLabel(status, t)}</Badge>
}
