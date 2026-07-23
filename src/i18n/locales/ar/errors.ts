import type { TranslationDictionary } from '../../types'

export const errorsAr: TranslationDictionary = {
  // Inventory module
  'errors.INVALID_STATE_TRANSITION':
    'لا يمكن تنفيذ هذا الإجراء: الحالة الحالية ({{currentStatus}}) لا تسمح به، ويتطلب أن تكون الحالة ({{requiredStatus}})',
  'errors.RESOURCE_NOT_FOUND': 'العنصر المطلوب غير موجود ({{entityType}} رقم {{entityId}})',
  'errors.DUPLICATE_OPERATION':
    'هذه العملية منفذة مسبقًا ولا يمكن تكرارها ({{entityType}} رقم {{entityId}})',
  'errors.ALREADY_PROCESSED':
    'تمت معالجة هذا العنصر مسبقًا ولا يمكن تنفيذ الإجراء ({{action}}) مرة أخرى',
  'errors.INSUFFICIENT_STOCK':
    'الكمية غير كافية للمادة {{materialName}}: المتاح {{available}} والمطلوب {{requested}}',
  'errors.BATCH_SHORTFALL':
    'الكمية المتبقية في الدفعة غير كافية للمادة {{materialName}}: المتاح في الدفعة {{availableInBatch}} والمطلوب {{requested}}',
  'errors.FREEZE_CONFLICT': 'لا يمكن تنفيذ العملية لوجود جرد مفتوح يشمل المواد التالية:',
  'errors.FREEZE_CONFLICT.item': '{{materialName}} (الجرد {{conflictingCountCode}})',
  'errors.RETURN_QUANTITY_EXCEEDED':
    'كمية الإرجاع للمادة {{materialName}} تتجاوز الكمية القابلة للإرجاع: المتاح {{returnable}} والمطلوب {{requested}}',
  'errors.WASTE_NOT_ALLOWED_POSITIVE_VARIANCE':
    'لا يمكن تسجيل هدر للمادة {{materialName}} لأن فرق الجرد موجب',
  'errors.UOM_CONVERSION_FAILED': 'تعذر التحويل من الوحدة {{fromUom}} إلى الوحدة {{toUom}}',
  'errors.EMPTY_DOCUMENT_LINES': 'لا يمكن تنفيذ العملية: المستند لا يحتوي على أي بنود',
  'errors.ORDER_CONSUMPTION_PENDING_DOC_RACE_LOST':
    'تم إنشاء مستند استهلاك الطلبات المعلّق بواسطة عملية أخرى؛ يرجى إعادة المحاولة.',
  'errors.ORDER_CONSUMPTION_RECIPE_NOT_RESOLVED':
    'يوجد بند طلب بدون وصفة مثبتة (الطلب {{orderId}}، البند {{orderLineId}}).',
  'errors.ORDER_CONSUMPTION_RECIPE_HAS_NO_ITEMS':
    'الوصفة {{recipeId}} لا تحتوي على مواد ولا يمكن استهلاكها.',
  'errors.ORDER_CONSUMPTION_MIXED_UOM':
    'المادة {{materialId}} مستخدمة بأكثر من وحدة في استهلاك الطلبات؛ استخدم وحدة واحدة لكل مادة.',
  'errors.ORDER_CONSUMPTION_ERROR_SERIALIZATION_FAILED':
    'تعذر حفظ تفاصيل أخطاء استهلاك الطلبات. يرجى إعادة المحاولة.',
  'errors.RESOURCE_NOT_AVAILABLE_FOR_TENANT':
    'العنصر المطلوب غير متاح لحسابك ({{entityType}} رقم {{entityId}})',
  'errors.DUPLICATE_CODE': "يوجد بالفعل {{entityType}} بالرمز '{{code}}'",
  'errors.CODE_IMMUTABLE': 'لا يمكن تغيير الرمز بعد إنشاء {{entityType}}',
  'errors.UOM_IN_USE': 'وحدة القياس مستخدمة ولا يمكن حذفها',
  'errors.GLOBAL_UOM_NOT_DELETABLE': 'لا يمكن حذف وحدات القياس العامة، يمكن إلغاء تفعيلها فقط',
  'errors.UNPOST_BLOCKED_HAS_RETURN':
    'لا يمكن إلغاء الترحيل: يوجد مرتجع مرتبط بهذه الفاتورة ({{returnCodes}}). قم بإلغاء ترحيل المرتجع أولًا.',
  'errors.UNPOST_BLOCKED_ORIGINAL_INVOICE_NOT_POSTED':
    'لا يمكن إلغاء ترحيل المرتجع: الفاتورة الأصلية ({{originalInvoiceId}}) لم تعد في حالة مرحّلة (الحالة الحالية: {{originalInvoiceStatus}}).',
  'errors.UNPOST_BLOCKED_BATCH_CONSUMED':
    'لا يمكن إلغاء الترحيل: تم استهلاك من دفعات الأصناف التالية',
  'errors.UNPOST_BLOCKED_BATCH_CONSUMED.item':
    '{{materialName}} — الدفعة {{batchId}} (الكمية المستهلكة {{consumedQuantity}})',
  'errors.VALIDATION_FAILED': 'بعض الحقول تحتوي على قيم غير صالحة، يرجى مراجعتها',
  'errors.VALIDATION_FAILED.field': 'قيمة غير صالحة ({{constraint}})',
  'errors.VALIDATION_FAILED.fieldGeneric': 'قيمة غير صالحة',

  // HR / Users / Branches / Jobs (shared HrErrorCode)
  'errors.INACTIVE_REFERENCE': 'العنصر المرجعي غير نشط ({{entityType}} رقم {{entityId}})',
  'errors.DEACTIVATION_BLOCKED':
    'لا يمكن إلغاء تفعيل {{entityType}} رقم {{entityId}} لارتباطه بـ {{blockedByEntityType}}',
  'errors.SELF_ACTION_BLOCKED': 'لا يمكنك تنفيذ الإجراء ({{action}}) على حسابك الحالي',
  'errors.NOT_ALLOWED_FOR_ROLE': 'هذا الإجراء غير مسموح للدور ({{roleCode}})',
  'errors.BRANCH_SCOPE_REQUIRED': 'يجب تحديد نطاق الفرع لتنفيذ هذا الإجراء',
  'errors.TENANT_CONTEXT_REQUIRED': 'يجب تحديد سياق المطعم لتنفيذ هذا الإجراء',
  'errors.UNSUPPORTED_OPERATION':
    'الحالة المطلوبة ({{requestedStatus}}) غير مدعومة؛ الحالات المسموحة: {{allowedStatuses}}',
  'errors.INSUFFICIENT_LEAVE_BALANCE':
    'رصيد الإجازة غير كافٍ: المتبقي {{remaining}} والمطلوب {{requested}}',
  'errors.NO_ACTIVE_LEAVE_TYPES':
    'لا توجد أنواع إجازات نشطة لهذا المطعم، يرجى إنشاء أنواع الإجازات أولاً',
  'errors.NEGATIVE_REMAINING_BALANCE':
    'لا يمكن أن يكون رصيد الإجازة المتبقي سالبًا ({{remainingDays}})',
  'errors.SYSTEM_TENANT_RESTRICTED': 'هذا الإجراء ({{action}}) غير مسموح في سياق المطعم النظامي',

  // RBAC module
  'errors.BRANCH_REQUIRED_FOR_ROLE': 'الدور {{roleName}} يتطلب تحديد فرع',
  'errors.BRANCH_NOT_ALLOWED_FOR_ROLE': 'لا يمكن ربط الدور {{roleName}} بفرع',

  // Common / cross-module
  'errors.DATA_INTEGRITY_VIOLATION': 'تعذر إتمام العملية لارتباط البيانات بسجلات أخرى',
  'errors.ACCESS_DENIED': 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
  'errors.INTERNAL_ERROR': 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى لاحقًا',
  'errors.LEGACY_ERROR': 'حدث خطأ أثناء تنفيذ العملية، يرجى المحاولة مرة أخرى',
  'errors.GENERIC_ERROR': 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى',

  // Menu module
  'errors.CATEGORY_HAS_PRODUCTS': 'لا يمكن حذف هذا التصنيف لأنه مرتبط بمنتجات',
  'errors.DUPLICATE_MATERIAL_IN_RECIPE':
    'المادة "{{materialName}}" موجودة بالفعل في هذه الوصفة',
  'errors.VARIANT_CANNOT_BE_MENU_ITEM':
    'لا يمكن عرض الصنف الفرعي على المنيو مباشرة. أزِله من المنيو ثم حاول مرة أخرى.',
  'errors.PARENT_PRODUCT_NOT_ORDERABLE':
    'هذه مجموعة أصناف ولا يمكن طلبها مباشرة. من فضلك اختر أحد أصنافها الفرعية.',
  'errors.PARENT_PRODUCT_HAS_NO_RECIPE':
    'هذا المنتج يجمع أصنافًا فرعية ولا يمكن أن تكون له وصفة خاصة. أضِف الوصفات لأصنافه الفرعية بدلًا من ذلك.',
  'errors.PRODUCT_WITH_RECIPE_CANNOT_BE_PARENT':
    'هذا المنتج له وصفة بالفعل، لذلك لا يمكن تحويله إلى مجموعة أصناف.',
  'errors.PRODUCT_HAS_VARIANTS':
    'هذا المنتج لديه أصناف مرتبطة به. قم بإلغاء ربط جميع الأصناف أولاً قبل الحذف.',
  'errors.PRODUCT_NOT_FOUND': 'المنتج غير موجود.',
  'errors.ADDON_HOST_MUST_BE_PARENT_ELIGIBLE':
    'يمكن ربط الإضافات بالمنتجات الرئيسية فقط وليس بالأصناف الفرعية.',
  'errors.ADDON_CANNOT_BE_SELF': 'لا يمكن إضافة المنتج كإضافة لنفسه.',
  'errors.DUPLICATE_ADD_ON': 'هذه الإضافة مرتبطة بالمنتج بالفعل.',

  // Orders module
  'errors.PRODUCT_HAS_NO_ACTIVE_RECIPE':
    'المنتج ده مفيهوش ريسيبي مفعّلة، مينفعش يتباع لحد ما تضاف له ريسيبي الأول.',
  'errors.WAREHOUSE_NOT_FOUND': 'لا يوجد مخزن نشط مضبوط لهذا الفرع.',
  'errors.AMBIGUOUS_WAREHOUSE_FOR_BRANCH':
    'يوجد أكثر من مخزن مضبوط لهذا الفرع (العدد {{warehouseCount}}).',

  // Assets module
  'errors.LINE_ASSET_MISMATCH':
    'بند الأصل {{assetLineId}} لا يتبع الأصل {{assetId}}.',

  // Devices module
  'errors.INVALID_DEVICE_SECRET': 'مفتاح الجهاز غير صحيح',
  'errors.DEVICE_INACTIVE': 'هذا الجهاز غير نشط ({{entityType}} رقم {{entityId}})',
  'errors.DEVICE_NOT_FOUND': 'الجهاز المطلوب غير موجود ({{entityType}} رقم {{entityId}})',
  'errors.BRANCH_NOT_FOUND': 'الفرع المحدد غير موجود ({{entityType}} رقم {{entityId}})',

  // Auth
  'errors.INVALID_CREDENTIALS':
    'بيانات الدخول غير صحيحة، تحقق من رمز المطعم واسم المستخدم وكلمة المرور',
  'errors.POS_LOGIN_NOT_PERMITTED': 'هذا المستخدم غير مسموح له بفتح الورديات على جهاز نقاط البيع',
  'errors.DEVICE_BRANCH_MISMATCH': 'هذا المستخدم غير مرتبط بفرع جهاز نقاط البيع المحدد',
}
