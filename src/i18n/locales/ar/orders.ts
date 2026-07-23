import type { TranslationDictionary } from '../../types'

export const ordersAr: TranslationDictionary = {
  'orders.hub.title': 'الطلبات',
  'orders.hub.subtitle': 'مراجعة الطلبات المكتملة وطلبات الاستلام الواردة',

  'orders.tabs.orders': 'الطلبات',
  'orders.tabs.orderRequests': 'طلبات الاستلام',

  'orders.list.title': 'الطلبات',
  'orders.list.loading': 'جاري تحميل الطلبات…',
  'orders.list.empty.title': 'لا توجد طلبات',
  'orders.list.empty.subtitle':
    'ستظهر الطلبات هنا بعد تسجيلها من نقطة البيع أو ربطها من المصادر الإلكترونية.',

  'orders.filter.allTypes': 'كل الأنواع',
  'orders.filter.allSources': 'كل المصادر',
  'orders.filter.dateFrom': 'من',
  'orders.filter.dateTo': 'إلى',

  'orders.col.orderDate': 'تاريخ الطلب',
  'orders.col.orderType': 'النوع',
  'orders.col.source': 'المصدر',
  'orders.col.status': 'الحالة',
  'orders.col.tableNo': 'الطاولة',
  'orders.col.total': 'الإجمالي',
  'orders.col.paymentMethod': 'الدفع',
  'orders.col.branch': 'الفرع',

  'orders.orderType.DINE_IN': 'تناول في المطعم',
  'orders.orderType.TAKEAWAY': 'تيك أواي',
  'orders.orderType.DELIVERY': 'توصيل',

  'orders.orderSource.POS': 'نقطة البيع',
  'orders.orderSource.ONLINE': 'إلكتروني',
  'orders.orderSource.AGGREGATOR': 'مجمّع',
  'orders.source.aggregatorWithName': 'مجمّع — {{name}}',

  'orders.status.COMPLETE': 'مكتمل',
  'orders.status.CANCELLED': 'ملغى',

  'orders.cancellationStage.BEFORE_KITCHEN': 'ملغى — قبل المطبخ',
  'orders.cancellationStage.IN_KITCHEN_COOKED': 'ملغى — مطبوخ في المطبخ',
  'orders.cancellationStage.IN_KITCHEN_NOT_COOKED': 'ملغى — في المطبخ (غير مطبوخ)',
  'orders.cancellationStage.AFTER_DONE': 'ملغى — بعد الإنجاز',

  'orders.paymentMethod.CASH': 'نقدي',
  'orders.paymentMethod.CARD': 'بطاقة',
  'orders.paymentMethod.WALLET': 'محفظة',
  'orders.paymentMethod.AGGREGATOR': 'مجمّع',

  'orders.pagination.summary': '{{from}}–{{to}} من {{total}}',
  'orders.pagination.pageOf': 'صفحة {{page}} من {{totalPages}}',
  'orders.pagination.prev': 'السابق',
  'orders.pagination.next': 'التالي',

  'orders.detail.title': 'طلب #{{id}}',
  'orders.detail.back': 'العودة إلى الطلبات',
  'orders.detail.loading': 'جاري تحميل الطلب…',
  'orders.detail.notFoundTitle': 'الطلب غير موجود',
  'orders.detail.notFoundMessage': 'قد يكون هذا الطلب محذوفاً أو ليس لديك صلاحية الوصول.',
  'orders.detail.infoTitle': 'معلومات الطلب',
  'orders.detail.warehouse': 'المخزن',
  'orders.detail.externalReference': 'المرجع الخارجي',
  'orders.detail.createdAt': 'وقت التسجيل',
  'orders.detail.updatedAt': 'آخر تحديث',
  'orders.detail.linesTitle': 'بنود الطلب',
  'orders.detail.col.product': 'المنتج',
  'orders.detail.col.quantity': 'الكمية',
  'orders.detail.col.unitPrice': 'سعر الوحدة',
  'orders.detail.col.lineTotal': 'إجمالي البند',
  'orders.detail.total': 'المبلغ الإجمالي',

  'orders.request.list.title': 'طلبات الاستلام',
  'orders.request.list.loading': 'جاري تحميل طلبات الاستلام…',
  'orders.request.list.empty.title': 'لا توجد طلبات استلام',
  'orders.request.list.empty.subtitle':
    'ستظهر طلبات الاستلام الإلكترونية والمجمّعة هنا قبل إرسالها إلى نقطة البيع.',

  'orders.request.col.createdAt': 'تاريخ الإنشاء',
  'orders.request.col.externalReference': 'المرجع الخارجي',

  'orders.request.source.ONLINE': 'إلكتروني',
  'orders.request.source.AGGREGATOR': 'مجمّع',
  'orders.request.source.aggregatorWithName': 'مجمّع — {{name}}',

  'orders.request.status.RECEIVED': 'مستلم',
  'orders.request.status.SENT_TO_POS': 'أُرسل إلى نقطة البيع',
  'orders.request.status.LINKED': 'مرتبط',

  'orders.request.detail.title': 'طلب استلام #{{id}}',
  'orders.request.detail.back': 'العودة إلى طلبات الاستلام',
  'orders.request.detail.loading': 'جاري تحميل الطلب…',
  'orders.request.detail.notFoundTitle': 'طلب الاستلام غير موجود',
  'orders.request.detail.notFoundMessage': 'قد يكون هذا الطلب محذوفاً أو ليس لديك صلاحية الوصول.',
  'orders.request.detail.infoTitle': 'معلومات الطلب',
  'orders.request.detail.aggregatorName': 'المجمّع',
  'orders.request.detail.sentToPosAt': 'تاريخ الإرسال إلى نقطة البيع',
  'orders.request.detail.payloadTitle': 'البيانات الخام',
  'orders.request.detail.payloadToggle': 'عرض حمولة JSON الأصلية',
  'orders.request.detail.payloadEmpty': 'لا توجد بيانات مخزنة لهذا الطلب.',
  'orders.request.detail.viewLinkedOrder': 'عرض الطلب المرتبط',
  'orders.request.detail.notLinked': 'لم يُربط بعد بطلب مكتمل.',
  'orders.request.detail.notLinkedReceived': 'مستلم، لم يُرسل بعد إلى نقطة البيع.',
  'orders.request.detail.notLinkedSentToPos': 'لم يُربط بعد — بانتظار تأكيد نقطة البيع.',
}
