export type RequestSource = 'ONLINE' | 'AGGREGATOR'
export type RequestStatus = 'RECEIVED' | 'SENT_TO_POS' | 'LINKED'

export interface IncomingOrderRequestView {
  id: number
  source: RequestSource
  aggregatorName?: string
  externalReferenceId?: string
  branchId?: number
  branchName?: string
  status: RequestStatus
  completedOrderId?: number
  sentToPosAt?: string
  createdAt: string
  /** Present on detail endpoint when backend stores the original payload. */
  rawPayload?: unknown
}

export interface OrderRequestListParams {
  source?: RequestSource
  status?: RequestStatus
  branchId?: number | string
  dateFrom?: string
  dateTo?: string
  page?: number
  size?: number
}
