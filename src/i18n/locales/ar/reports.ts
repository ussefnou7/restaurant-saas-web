import type { TranslationDictionary } from '../../types'

export const reportsAr: TranslationDictionary = {
  'reports.accessDenied': 'ليست لديك صلاحية عرض التقارير.',
  'reports.loading': 'جاري تحميل التقرير...',
  'reports.actions.refresh': 'تحديث',
  'reports.actions.exportCsv': 'CSV',
  'reports.actions.exportPdf': 'PDF',

  'reports.filters.title': 'الفلاتر',
  'reports.filters.branch': 'الفرع',
  'reports.filters.warehouse': 'مكان التخزين',
  'reports.filters.category': 'مجموعة المواد',
  'reports.filters.dateFrom': 'من',
  'reports.filters.dateTo': 'إلى',
  'reports.filters.allBranches': 'كل الفروع',
  'reports.filters.allWarehouses': 'كل أماكن التخزين',
  'reports.filters.allCategories': 'كل مجموعات المواد',
  'reports.filters.selectBranchFirst': 'اختر الفرع أولاً',

  'reports.empty.title': 'لا توجد صفوف في التقرير',
  'reports.empty.subtitle': 'عدّل الفلاتر وحدّث التقرير.',

  'reports.stockValuation.title': 'تقييم المخزون',
  'reports.stockValuation.subtitle': 'قيمة المخزون حسب المادة ومكان التخزين.',

  'reports.columns.warehouseId': 'معرّف المستودع',
  'reports.columns.warehouseName': 'المستودع',
  'reports.columns.warehouseNameAr': 'اسم المستودع بالعربية',
  'reports.columns.materialId': 'معرّف المادة',
  'reports.columns.materialName': 'المادة',
  'reports.columns.materialNameAr': 'اسم المادة بالعربية',
  'reports.columns.categoryId': 'معرّف الفئة',
  'reports.columns.categoryName': 'الفئة',
  'reports.columns.categoryNameAr': 'اسم الفئة بالعربية',
  'reports.columns.quantity': 'الكمية',
  'reports.columns.averageCost': 'متوسط التكلفة',
  'reports.columns.totalValue': 'القيمة الإجمالية',

  'reports.pagination.summary': '{{from}}-{{to}} من {{total}}',
  'reports.pagination.prev': 'السابق',
  'reports.pagination.next': 'التالي',
  'reports.pagination.pageOf': 'صفحة {{page}} من {{totalPages}}',
}
