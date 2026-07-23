import type { TranslationDictionary } from '../../types'

export const ordersEn: TranslationDictionary = {
  'orders.hub.title': 'Orders',
  'orders.hub.subtitle': 'Review completed orders and incoming order requests',

  'orders.tabs.orders': 'Orders',
  'orders.tabs.orderRequests': 'Order Requests',

  'orders.list.title': 'Orders',
  'orders.list.loading': 'Loading orders…',
  'orders.list.empty.title': 'No orders found',
  'orders.list.empty.subtitle': 'Orders will appear here once recorded by the POS or linked from online sources.',

  'orders.filter.allTypes': 'All types',
  'orders.filter.allSources': 'All sources',
  'orders.filter.dateFrom': 'From',
  'orders.filter.dateTo': 'To',

  'orders.col.orderDate': 'Order date',
  'orders.col.orderType': 'Type',
  'orders.col.source': 'Source',
  'orders.col.status': 'Status',
  'orders.col.tableNo': 'Table',
  'orders.col.total': 'Total',
  'orders.col.paymentMethod': 'Payment',
  'orders.col.branch': 'Branch',

  'orders.orderType.DINE_IN': 'Dine in',
  'orders.orderType.TAKEAWAY': 'Takeaway',
  'orders.orderType.DELIVERY': 'Delivery',

  'orders.orderSource.POS': 'POS',
  'orders.orderSource.ONLINE': 'Online',
  'orders.orderSource.AGGREGATOR': 'Aggregator',
  'orders.source.aggregatorWithName': 'Aggregator — {{name}}',

  'orders.status.COMPLETE': 'Complete',
  'orders.status.CANCELLED': 'Cancelled',

  'orders.cancellationStage.BEFORE_KITCHEN': 'Cancelled — before kitchen',
  'orders.cancellationStage.IN_KITCHEN_COOKED': 'Cancelled — cooked in kitchen',
  'orders.cancellationStage.IN_KITCHEN_NOT_COOKED': 'Cancelled — in kitchen (not cooked)',
  'orders.cancellationStage.AFTER_DONE': 'Cancelled — after done',

  'orders.paymentMethod.CASH': 'Cash',
  'orders.paymentMethod.CARD': 'Card',
  'orders.paymentMethod.WALLET': 'Wallet',
  'orders.paymentMethod.AGGREGATOR': 'Aggregator',

  'orders.pagination.summary': '{{from}}–{{to}} of {{total}}',
  'orders.pagination.pageOf': 'Page {{page}} of {{totalPages}}',
  'orders.pagination.prev': 'Previous',
  'orders.pagination.next': 'Next',

  'orders.detail.title': 'Order #{{id}}',
  'orders.detail.back': 'Back to orders',
  'orders.detail.loading': 'Loading order…',
  'orders.detail.notFoundTitle': 'Order not found',
  'orders.detail.notFoundMessage': 'This order may have been removed or you may not have access.',
  'orders.detail.infoTitle': 'Order information',
  'orders.detail.warehouse': 'Warehouse',
  'orders.detail.externalReference': 'External reference',
  'orders.detail.createdAt': 'Recorded at',
  'orders.detail.updatedAt': 'Last updated',
  'orders.detail.linesTitle': 'Line items',
  'orders.detail.col.product': 'Product',
  'orders.detail.col.quantity': 'Qty',
  'orders.detail.col.unitPrice': 'Unit price',
  'orders.detail.col.lineTotal': 'Line total',
  'orders.detail.total': 'Total amount',

  'orders.request.list.title': 'Order requests',
  'orders.request.list.loading': 'Loading order requests…',
  'orders.request.list.empty.title': 'No order requests found',
  'orders.request.list.empty.subtitle':
    'Incoming online and aggregator requests will appear here before they are forwarded to the POS.',

  'orders.request.col.createdAt': 'Created',
  'orders.request.col.externalReference': 'External reference',

  'orders.request.source.ONLINE': 'Online',
  'orders.request.source.AGGREGATOR': 'Aggregator',
  'orders.request.source.aggregatorWithName': 'Aggregator — {{name}}',

  'orders.request.status.RECEIVED': 'Received',
  'orders.request.status.SENT_TO_POS': 'Sent to POS',
  'orders.request.status.LINKED': 'Linked',

  'orders.request.detail.title': 'Request #{{id}}',
  'orders.request.detail.back': 'Back to order requests',
  'orders.request.detail.loading': 'Loading request…',
  'orders.request.detail.notFoundTitle': 'Request not found',
  'orders.request.detail.notFoundMessage': 'This request may have been removed or you may not have access.',
  'orders.request.detail.infoTitle': 'Request information',
  'orders.request.detail.aggregatorName': 'Aggregator',
  'orders.request.detail.sentToPosAt': 'Sent to POS',
  'orders.request.detail.payloadTitle': 'Raw payload',
  'orders.request.detail.payloadToggle': 'Show original JSON payload',
  'orders.request.detail.payloadEmpty': 'No payload stored for this request.',
  'orders.request.detail.viewLinkedOrder': 'View linked order',
  'orders.request.detail.notLinked': 'Not yet linked to a completed order.',
  'orders.request.detail.notLinkedReceived': 'Received, not yet forwarded to POS.',
  'orders.request.detail.notLinkedSentToPos': 'Not yet linked — still awaiting POS confirmation.',
}
