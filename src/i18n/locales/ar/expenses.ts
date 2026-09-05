export const expensesAr = {
  // Navigation & Page Titles
  'expenses.title': 'المصروفات',
  'expenses.subtitle': 'سجلات المصروفات التشغيلية ومتابعتها',
  'expenses.categories.title': 'تصنيفات المصروفات',
  'expenses.categories.subtitle': 'إدارة تصنيفات المصروفات للأعمال',
  'expenses.categories.manage': 'إدارة التصنيفات',
  'expenses.categories.backToExpenses': 'العودة إلى المصروفات',
  'layout.nav.expenses': 'المصروفات',

  // Boundary notice (D115)
  'expenses.boundaryNotice': 'أي حاجة بتدخل المخزن ليها مستند شراء مش مصروف. سجّل هنا الفلوس اللي خرجت وماقابلهاش مخزون.',

  // Enums - Payment Source
  'expenses.paymentSource.CASH_DRAWER': 'درج الكاشير',
  'expenses.paymentSource.CASH_ON_HAND': 'نقدية',
  'expenses.paymentSource.BANK': 'تحويل بنكي',

  // Enums - Status
  'expenses.status.ACTIVE': 'نشط',
  'expenses.status.VOIDED': 'ملغي',

  // Filters
  'expenses.filters.search': 'البحث في البيان أو المستفيد...',
  'expenses.filters.allBranches': 'جميع الفروع',
  'expenses.filters.companyLevelOnly': 'على مستوى الشركة فقط',
  'expenses.filters.allCategories': 'جميع التصنيفات',
  'expenses.filters.allPaymentSources': 'جميع مصادر الدفع',
  'expenses.filters.allStatuses': 'جميع الحالات',
  'expenses.filters.dateFrom': 'من تاريخ',
  'expenses.filters.dateTo': 'إلى تاريخ',
  'expenses.filters.branch': 'تصفية حسب الفرع',
  'expenses.filters.category': 'تصفية حسب التصنيف',
  'expenses.filters.paymentSource': 'تصفية حسب مصدر الدفع',
  'expenses.filters.status': 'تصفية حسب الحالة',

  // Table Columns
  'expenses.columns.date': 'تاريخ المصروف',
  'expenses.columns.category': 'التصنيف',
  'expenses.columns.branch': 'الفرع',
  'expenses.columns.description': 'البيان',
  'expenses.columns.payee': 'المستفيد',
  'expenses.columns.amount': 'المبلغ',
  'expenses.columns.paymentSource': 'مصدر الدفع',
  'expenses.columns.status': 'الحالة',
  'expenses.columns.actions': 'الإجراءات',

  // Branch Labels
  'expenses.branch.companyLevel': 'على مستوى الشركة',

  // Create Modal
  'expenses.create.title': 'مصروف جديد',
  'expenses.create.button': 'مصروف جديد',
  'expenses.create.category': 'التصنيف',
  'expenses.create.categoryPlaceholder': 'اختر التصنيف',
  'expenses.create.amount': 'المبلغ',
  'expenses.create.amountPlaceholder': '0.00',
  'expenses.create.date': 'تاريخ المصروف',
  'expenses.create.branch': 'الفرع',
  'expenses.create.branchPlaceholder': 'اختر الفرع أو على مستوى الشركة',
  'expenses.create.branchCompanyLevel': 'على مستوى الشركة (بدون فرع)',
  'expenses.create.description': 'البيان',
  'expenses.create.descriptionPlaceholder': 'بيان اختياري للمصروف (بحد أقصى 500 حرف)',
  'expenses.create.payee': 'المستفيد',
  'expenses.create.payeePlaceholder': 'اسم المستفيد اختياري (بحد أقصى 255 حرف)',
  'expenses.create.paymentSource': 'مصدر الدفع',
  'expenses.create.paymentSourcePlaceholder': 'اختر مصدر الدفع',
  'expenses.create.submit': 'تسجيل المصروف',
  'expenses.create.submitting': 'جاري التسجيل...',
  'expenses.create.cancel': 'إلغاء',
  'expenses.create.success': 'تم تسجيل المصروف بنجاح',

  // Void Modal (D117)
  'expenses.void.title': 'إلغاء المصروف رقم #{{id}}',
  'expenses.void.button': 'إلغاء',
  'expenses.void.permanentNotice': 'لا يمكن التراجع عن الإلغاء. سيبقى السجل ظاهراً في القائمة كملغي مع إرفاق سبب الإلغاء.',
  'expenses.void.reasonLabel': 'سبب الإلغاء',
  'expenses.void.reasonPlaceholder': 'وضح سبب إلغاء هذا المصروف (إجباري، بحد أقصى 500 حرف)...',
  'expenses.void.reasonRequired': 'سبب الإلغاء مطلوب.',
  'expenses.void.submit': 'تأكيد الإلغاء',
  'expenses.void.submitting': 'جاري الإلغاء...',
  'expenses.void.cancel': 'تراجع',
  'expenses.void.success': 'تم إلغاء المصروف بنجاح',
  'expenses.void.viewReason': 'سبب الإلغاء: {{reason}}',

  // Categories Management (D116)
  'expenses.categories.new': 'تصنيف جديد',
  'expenses.categories.edit': 'تعديل التصنيف',
  'expenses.categories.nameEn': 'اسم التصنيف (بالإنجليزية)',
  'expenses.categories.nameAr': 'اسم التصنيف (بالعربية)',
  'expenses.categories.namePlaceholder': 'أدخل اسم التصنيف',
  'expenses.categories.nameArPlaceholder': 'الاسم بالعربية اختياري',
  'expenses.categories.scope': 'النوع',
  'expenses.categories.scopeGlobal': 'افتراضي عام',
  'expenses.categories.scopeTenant': 'تصنيف مخصص',
  'expenses.categories.statusActive': 'نشط',
  'expenses.categories.statusInactive': 'غير نشط',
  'expenses.categories.activate': 'تفعيل',
  'expenses.categories.deactivate': 'تعطيل',
  'expenses.categories.activateSuccess': 'تم تفعيل التصنيف بنجاح',
  'expenses.categories.deactivateSuccess': 'تم تعطيل التصنيف بنجاح',
  'expenses.categories.createSuccess': 'تم إنشاء التصنيف بنجاح',
  'expenses.categories.updateSuccess': 'تم تحديث التصنيف بنجاح',
  'expenses.categories.globalReadOnlyNotice': 'التصنيفات الافتراضية العامة للقراءة فقط ولا يمكن تعديلها أو تعطيلها.',

  // Empty States & Errors
  'expenses.empty.title': 'لا توجد مصروفات مسجلة',
  'expenses.empty.description': 'ابدأ بتسجيل أول مصروف.',
  'expenses.emptyFilter.title': 'لا توجد نتائج مطابقة',
  'expenses.emptyFilter.description': 'جرّب تعديل الفلاتر أو عبارات البحث.',
  'expenses.categories.empty.title': 'لا توجد تصنيفات',
  'expenses.categories.empty.description': 'لا توجد تصنيفات مصروفات مطابقة للفلتر الحالي.',

  // Pagination
  'expenses.pagination.summary': 'عرض {{from}} إلى {{to}} من أصل {{total}} مصروف',
  'expenses.pagination.prev': 'السابق',
  'expenses.pagination.next': 'التالي',
  'expenses.pagination.pageOf': 'صفحة {{page}} من {{totalPages}}',

  // Structured Error Codes (Contract table)
  'errors.EXPENSE_NOT_FOUND': 'المصروف غير موجود (رقم: {{expenseId}})',
  'errors.EXPENSE_CATEGORY_NOT_FOUND': 'تصنيف المصروف غير موجود (رقم: {{categoryId}})',
  'errors.BRANCH_NOT_FOUND': 'الفرع غير موجود (رقم: {{branchId}})',
  'errors.EXPENSE_CATEGORY_INACTIVE': 'تصنيف المصروف "{{categoryName}}" غير نشط ولا يمكن استخدامه',
  'errors.EXPENSE_INVALID_AMOUNT': 'مبلغ المصروف غير صالح: {{amount}}. يجب أن يكون المبلغ أكبر من صفر',
  'errors.EXPENSE_DATE_IN_FUTURE': 'تاريخ المصروف {{expenseDate}} لا يمكن أن يكون في المستقبل (اليوم هو {{today}})',
  'errors.EXPENSE_ALREADY_VOIDED': 'المصروف رقم {{expenseId}} تم إلغاؤه بالفعل بتاريخ {{voidedAt}}',
  'errors.EXPENSE_NOT_MANUAL': 'لا يمكن إلغاء المصروف رقم {{expenseId}} مباشرة لأن نوع المصدر هو {{sourceType}}',
  'errors.EXPENSE_VOID_REASON_REQUIRED': 'سبب الإلغاء مطلوب لإلغاء المصروف رقم {{expenseId}}',
  'errors.EXPENSE_CATEGORY_IS_GLOBAL': 'لا يمكن تعديل أو تعطيل التصنيف العام للمصروفات (رقم: {{categoryId}})',
  'errors.EXPENSE_CATEGORY_NAME_EXISTS': 'يوجد تصنيف مصروفات آخر بالاسم "{{name}}"',
}
