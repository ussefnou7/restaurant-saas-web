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

  // Auth
  'errors.INVALID_CREDENTIALS':
    'بيانات الدخول غير صحيحة، تحقق من رمز المطعم واسم المستخدم وكلمة المرور',
}
