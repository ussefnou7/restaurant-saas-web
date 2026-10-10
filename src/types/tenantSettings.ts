export type TenantSettingsResponse = {
  tenantId: number
  tenantName: string
  taxEnabled: boolean
  taxRate: number
  taxOnServiceCharge: boolean
  serviceChargeEnabled: boolean
  serviceChargeRate: number
  dineInEnabled: boolean
  takeawayEnabled: boolean
  deliveryEnabled: boolean
  createdAt: string
  updatedAt: string
}

/** The API accepts a complete replacement; do not send a partial patch. */
export type UpdateTenantSettingsRequest = Pick<
  TenantSettingsResponse,
  | 'taxEnabled'
  | 'taxRate'
  | 'taxOnServiceCharge'
  | 'serviceChargeEnabled'
  | 'serviceChargeRate'
  | 'dineInEnabled'
  | 'takeawayEnabled'
  | 'deliveryEnabled'
>
