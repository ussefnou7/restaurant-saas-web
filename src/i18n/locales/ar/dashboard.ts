import type { TranslationDictionary } from '../../types'

/**
 * لوحة المالك.
 *
 * نصوص التنبيهات مكتوبة ليُتخذ عليها إجراء، لا لتُقرأ فقط: كل تنبيه يقول ما المشكلة، وأين، وبكام —
 * لأن تنبيه لا يستطيع المالك إلا أن ينظر إليه هو ضجيج. والقيم المبنية على افتراض تُعلَّم «تقديري»
 * من مفتاح واحد مشترك، حتى لا تُنسى العلامة في تنبيه من سبعة عشر.
 */
export const dashboardAr: TranslationDictionary = {
  'dashboard.title': 'لوحة التحكم',
  'dashboard.subtitle': 'إيه اللي محتاج انتباه، وإيه أداء الفترة',

  'dashboard.modes.today': 'اليوم',
  'dashboard.modes.month': 'الشهر',
  'dashboard.modes.year': 'السنة',

  'dashboard.actions.refresh': 'تحديث',
  'dashboard.loading': 'جاري تحميل اللوحة...',
  'dashboard.alerts.loading': 'جارٍ فحص التنبيهات...',
  'dashboard.alerts.loadError': 'تعذر فحص التنبيهات. حدّث الصفحة للمحاولة مرة أخرى.',
  'dashboard.summary.loadError': 'تعذر تحميل بيانات هذه الفترة. حدّث الصفحة للمحاولة مرة أخرى.',
  'dashboard.generatedAt': 'حتى {{time}}',

  'dashboard.block.hidden.title': 'غير متاح لك',
  'dashboard.block.hidden.body':
    'هذا القسم يأتي من وحدة ليس لديك صلاحية الاطلاع عليها. القسم مخفي، وليس فارغًا.',
  'dashboard.block.insufficient.title': 'لا توجد بيانات كافية',
  'dashboard.block.insufficient.body': 'لا يوجد في هذه الفترة ما يمكن حساب هذا الرقم منه.',
  'dashboard.block.empty': 'لا توجد سجلات في هذه الفترة.',
  'dashboard.unknown': 'غير معروف',

  'dashboard.kpis.netSales': 'صافي المبيعات',
  'dashboard.kpis.netSales.hint': 'بدون الضريبة',
  'dashboard.kpis.orders': 'الأوردرات',
  'dashboard.kpis.averageCheck': 'متوسط الفاتورة',
  'dashboard.kpis.averageCheck.hint': 'صافي المبيعات لكل أوردر',
  'dashboard.kpis.wasteValue': 'الهالك',
  'dashboard.kpis.wasteValue.hint': 'خلال هذه الفترة',
  'dashboard.kpis.stockValue': 'قيمة المخزون',
  'dashboard.kpis.stockValue.hint': 'الآن، وليس عن الفترة',

  'dashboard.peak.HOUR': 'أعلى ساعة',
  'dashboard.peak.DAY': 'أعلى يوم',
  'dashboard.peak.MONTH': 'أعلى شهر',
  'dashboard.peak.meta': '{{value}} على {{orders}} أوردر',
  'dashboard.peak.none': 'لا مبيعات في هذه الفترة',

  'dashboard.health.title': 'سلامة البيانات',
  'dashboard.health.summary': '{{count}} مستند ترحيل لم يكتمل — ومعها الإلغاءات حسب المرحلة',
  'dashboard.health.summary.unknown': 'مسار الترحيل والإلغاءات لهذه الفترة',

  'dashboard.costCoverage.title': 'تغطية التكلفة',
  'dashboard.costCoverage.subtitle':
    'أقل من 100% يعني أن بعض المبيعات بلا تكلفة مسجّلة، وبالتالي أي هامش ربح لهذه الفترة أعلى من الحقيقة.',
  'dashboard.costCoverage.headline': '{{percent}}% من المبيعات تكلفتها مُرحّلة',
  'dashboard.costCoverage.headline.unknown': 'لا توجد مبيعات تُرحَّل لها تكلفة',
  'dashboard.costCoverage.noSales': 'لم يُبَع شيء في هذه الفترة، فلا توجد تكلفة تُغطّى.',
  'dashboard.costCoverage.totalSales': 'مبيعات الفترة',
  'dashboard.costCoverage.posted': 'تكلفة مُرحّلة',
  'dashboard.costCoverage.posted.hint': 'محسوبة في الأرقام أعلاه',
  'dashboard.costCoverage.unposted': 'متوقفة على مستند معلّق',
  'dashboard.costCoverage.unposted.hint': 'محتاج حد يخلّصه',
  'dashboard.costCoverage.noConsumption': 'بدون وصفة، فلم تُجدول لها تكلفة من الأصل',
  'dashboard.costCoverage.noConsumption.hint': 'لا يوجد مستند معلّق — الوصفة ناقصة',

  'dashboard.trend.bucket.HOUR': 'بالساعة',
  'dashboard.trend.bucket.DAY': 'باليوم',
  'dashboard.trend.bucket.MONTH': 'بالشهر',
  'dashboard.trend.axis.hour': '{{hour}}:00',
  'dashboard.trend.peak': 'الأعلى {{value}}',
  'dashboard.trend.point': '{{label}}: {{sales}} على {{orders}} أوردر',
  'dashboard.trend.point.partial': '{{label}}: {{sales}} على {{orders}} أوردر — لسه جارية',
  'dashboard.trend.partial.HOUR': 'الساعة المظللة لسه جارية',
  'dashboard.trend.partial.DAY': 'اليوم المظلل لسه جاري',
  'dashboard.trend.partial.MONTH': 'الشهر المظلل لسه جاري',

  'dashboard.branches.title': 'حسب الفرع',
  'dashboard.branches.meta': '{{share}}% من المبيعات · {{orders}} أوردر',
  'dashboard.branches.meta.noShare': '{{orders}} أوردر',
  'dashboard.branches.meta.average': 'متوسط الفاتورة {{value}}',

  'dashboard.orderTypes.title': 'قنوات البيع',
  'dashboard.paymentMethods.title': 'طرق الدفع',
  'dashboard.cancellations.title': 'الإلغاءات',
  'dashboard.cancellations.subtitle': 'حسب المرحلة، لا حسب الساعة — وقت الإلغاء غير مسجّل بدقة.',
  'dashboard.mix.meta': '{{total}} على {{orders}} أوردر',
  'dashboard.mix.column.dimension': 'النوع',
  'dashboard.mix.column.orders': 'الأوردرات',
  'dashboard.mix.column.total': 'الإجمالي',
  'dashboard.mix.column.share': 'النسبة',

  'dashboard.orderType.DINE_IN': 'في المطعم',
  'dashboard.orderType.TAKEAWAY': 'تيك أواي',
  'dashboard.orderType.DELIVERY': 'دليفري',

  'dashboard.paymentMethod.CASH': 'نقدي',
  'dashboard.paymentMethod.CARD': 'بطاقة',
  'dashboard.paymentMethod.WALLET': 'محفظة',
  'dashboard.paymentMethod.AGGREGATOR': 'تطبيق توصيل',
  'dashboard.paymentMethod.UNSPECIFIED': 'غير محدد',

  'dashboard.cancellationStage.BEFORE_KITCHEN': 'قبل المطبخ',
  'dashboard.cancellationStage.IN_KITCHEN_NOT_COOKED': 'في المطبخ وقبل الطهي',
  'dashboard.cancellationStage.IN_KITCHEN_COOKED': 'بعد الطهي',
  'dashboard.cancellationStage.AFTER_DONE': 'بعد التجهيز',

  'dashboard.pipeline.title': 'مسار ترحيل التكلفة',
  'dashboard.pipeline.subtitle': 'كم مستند في كل مرحلة، وعمر أقدم واحد فيها.',
  'dashboard.pipeline.column.status': 'المرحلة',
  'dashboard.pipeline.column.count': 'المستندات',
  'dashboard.pipeline.column.oldest': 'الأقدم',
  'dashboard.pipeline.status.PENDING': 'بيتجمّع',
  'dashboard.pipeline.status.IN_PROGRESS': 'بيترحّل',
  'dashboard.pipeline.status.PARTIAL': 'وقف في النص',
  'dashboard.pipeline.status.CONFLICT': 'فشل',
  'dashboard.pipeline.status.POSTED': 'مُرحّل',

  'dashboard.alerts.title': 'محتاج انتباه',
  'dashboard.alerts.clear.title': 'مفيش حاجة محتاجة انتباه',
  'dashboard.alerts.clear.body': 'لا توجد مشاكل مفتوحة في فروعك الآن.',
  'dashboard.alerts.withheld':
    '{{count}} أنواع من التنبيهات لم تُفحص لأنك لا تملك صلاحية الاطلاع عليها.',
  'dashboard.alerts.severity.CRITICAL': 'حرج',
  'dashboard.alerts.severity.WARNING': 'تنبيه',
  'dashboard.alerts.severity.INFO': 'ملاحظة',
  'dashboard.alerts.estimate': 'تقديري',
  'dashboard.alerts.expand': 'عرض الفروع',
  'dashboard.alerts.collapse': 'إخفاء الفروع',
  'dashboard.alerts.open': 'فتح',
  'dashboard.alerts.noAge': 'لا يوجد تاريخ بداية مسجّل',
  'dashboard.alerts.age.minutes': 'من {{count}} دقيقة',
  'dashboard.alerts.age.hours': 'من {{count}} ساعة',
  'dashboard.alerts.age.days': 'من {{count}} يوم',
  'dashboard.alerts.scope.warehouse': '{{warehouse}} — {{branch}}',
  'dashboard.alerts.scope.branch': '{{branch}}',
  'dashboard.alerts.scope.tenant': 'كل الفروع',
  'dashboard.alerts.row.count': '{{count}}',

  'dashboard.alerts.UNPOSTED_CONSUMPTION.title': 'تكلفة مبيعات غير مُرحّلة',
  'dashboard.alerts.UNPOSTED_CONSUMPTION.body':
    '{{count}} مستند وقف قبل الترحيل. وطالما هم مفتوحين، الربح أعلى من الحقيقة بحوالي المبلغ ده، وكل هامش في الصفحة غلط بنفس المقدار.',
  'dashboard.alerts.UNPOSTED_PURCHASE_INVOICE.title': 'فواتير شراء غير مُرحّلة',
  'dashboard.alerts.UNPOSTED_PURCHASE_INVOICE.body':
    '{{count}} فاتورة استلمتها بضاعتها من أكثر من {{thresholdDays}} يوم ولسه مش مُرحّلة، فالبضاعة على الرف وناقصة من الدفاتر.',
  'dashboard.alerts.FROZEN_PHYSICAL_COUNT.title': 'جرد متجمّد',
  'dashboard.alerts.FROZEN_PHYSICAL_COUNT.body':
    '{{count}} جرد متجمّد من أكثر من {{thresholdDays}} يوم. أصنافه لا يمكن جردها مرة أخرى قبل أن ينتهي.',
  'dashboard.alerts.SHIFT_OPEN_TOO_LONG.title': 'ورديات مفتوحة',
  'dashboard.alerts.SHIFT_OPEN_TOO_LONG.body':
    '{{count}} وردية مفتوحة من أكثر من {{thresholdHours}} ساعة. محدش عدّ الدرج، فمفيش رقم نقدية ليها.',
  'dashboard.alerts.CONSUMPTION_SCHEDULER_STALLED.title': 'ترحيل التكلفة متوقف',
  'dashboard.alerts.CONSUMPTION_SCHEDULER_STALLED.body':
    '{{count}} مستند فات موعد ترحيله بأكثر من {{overdueHours}} ساعة. دي مشكلة في النظام، مش حاجة الفرع يقدر يحلها.',
  'dashboard.alerts.STOCK_OUT.title': 'أصناف خلصت',
  'dashboard.alerts.STOCK_OUT.body':
    '{{count}} صنف خلص. أي طبق فيه الأصناف دي نازل من المنيو لحد ما تتشترى.',
  'dashboard.alerts.BELOW_MINIMUM.title': 'تحت الحد الأدنى',
  'dashboard.alerts.BELOW_MINIMUM.body': '{{count}} صنف تحت حد إعادة الطلب.',
  'dashboard.alerts.RUNNING_OUT_SOON.title': 'هتخلص قريب',
  'dashboard.alerts.RUNNING_OUT_SOON.body':
    '{{count}} صنف هيخلص في حدود يومين. الأقرب: {{soonestMaterialNameAr}}، يكفي حوالي {{soonestDaysOfCover}} يوم بمعدل آخر {{rateWindowDays}} يوم.',
  'dashboard.alerts.EXPIRED_STOCK_ON_SHELF.title': 'بضاعة منتهية على الرف',
  'dashboard.alerts.EXPIRED_STOCK_ON_SHELF.body':
    '{{count}} دفعة فات تاريخ صلاحيتها ولسه فيها كميات. دي مسألة سلامة غذاء بغض النظر عن القيمة.',
  'dashboard.alerts.EXPIRING_SOON.title': 'قرب تنتهي خلال {{withinDays}} أيام',
  'dashboard.alerts.EXPIRING_SOON.body':
    'بضاعة بالقيمة دي هتنتهي خلال {{withinDays}} أيام. استخدمها أو اعمل عليها عرض.',
  'dashboard.alerts.MISSING_EXPIRY_DATE.title': 'تواريخ صلاحية ناقصة',
  'dashboard.alerts.MISSING_EXPIRY_DATE.body':
    '{{count}} دفعة من أصناف بتتبع الصلاحية بدون تاريخ انتهاء، فتنبيهات الصلاحية مش شايفاها.',
  'dashboard.alerts.CASH_VARIANCE.title': 'فروق نقدية',
  'dashboard.alerts.CASH_VARIANCE.body':
    '{{count}} وردية في آخر {{lookbackDays}} يوم قفلت خارج الحد المسموح. ده إجمالي الفرق، زيادة أو نقصان.',
  'dashboard.alerts.CASHIER_SHORTAGE_PATTERN.title': 'نمط عجز كاشير',
  'dashboard.alerts.CASHIER_SHORTAGE_PATTERN.body':
    '{{cashierName}} طلع ناقص في {{shiftCount}} وردية خلال {{windowDays}} يوم. عجز مرة واحدة ضجيج، لكن النمط يستحق كلام.',
  'dashboard.alerts.CANCELLED_AFTER_COOKING.title': 'إلغاء بعد الطهي',
  'dashboard.alerts.CANCELLED_AFTER_COOKING.body':
    '{{count}} أوردر اتلغى بعد ما الأكل اتطبخ. الأكل اتعمل ومحدش دفع.',
  'dashboard.alerts.CANCELLED_AFTER_COOKING.caveat':
    'الخسارة الحقيقية أكبر: الأكل الملغي لسه مش منزّل من المخزون.',
  'dashboard.alerts.LARGE_COUNT_VARIANCE.title': 'عجز جرد كبير',
  'dashboard.alerts.LARGE_COUNT_VARIANCE.body':
    '{{count}} جرد اتسوّى في آخر {{lookbackDays}} يوم حرّك المقدار ده من المخزون بدون تفسير.',
  'dashboard.alerts.SUPPLIER_PRICE_JUMP.title': 'أسعار الشراء غليت',
  'dashboard.alerts.SUPPLIER_PRICE_JUMP.body':
    '{{materialCount}} صنف غلي {{thresholdPercent}}% على الأقل خلال آخر {{windowDays}} يوم. الأسوأ: {{worstMaterialNameAr}}، بزيادة {{worstChangePercent}}%.',
  'dashboard.alerts.BRANCH_SILENT.title': 'فرع ساكت',
  'dashboard.alerts.BRANCH_SILENT.body':
    'في وردية مفتوحة ومفيش أوردر جديد من {{silentMinutes}} دقيقة. غالبًا كاشير واقف أو اتصال مقطوع.',
}
