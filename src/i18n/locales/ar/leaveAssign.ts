import type { TranslationDictionary } from '../../types'

export const leaveAssignAr: TranslationDictionary = {
  'leaveAssign.title': 'أرصدة الإجازات',
  'leaveAssign.subtitle': 'أرصدة الإجازات المخصصة للموظف حسب نوع الإجازة والسنة',
  'leaveAssign.actions.generate': 'إنشاء أرصدة الإجازات',
  'leaveAssign.actions.edit': 'تعديل',
  'leaveAssign.actions.save': 'حفظ التغييرات',
  'leaveAssign.actions.goToLeaveTypes': 'الذهاب إلى أنواع الإجازات',
  'leaveAssign.actions.manageLeaveTypes': 'إدارة أنواع الإجازات',
  'leaveAssign.messages.generateSuccess': 'تم إنشاء أرصدة الإجازات بنجاح.',
  'leaveAssign.messages.updateSuccess': 'تم تحديث رصيد الإجازة بنجاح.',
  'leaveAssign.errors.load': 'تعذر تحميل أرصدة الإجازات',
  'leaveAssign.errors.generate': 'تعذر إنشاء أرصدة الإجازات',
  'leaveAssign.errors.update': 'تعذر تحديث رصيد الإجازة',
  'leaveAssign.errors.noActiveLeaveTypes':
    'لا توجد أنواع إجازات نشطة. برجاء إضافة أنواع الإجازات أولًا.',
  'leaveAssign.errors.negativeRemaining': 'لا يمكن أن يكون الرصيد المخصص أقل من الأيام المستخدمة.',
  'leaveAssign.errors.forbidden': 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
  'leaveAssign.empty.title': 'لا توجد أرصدة إجازات',
  'leaveAssign.empty.subtitle':
    'يمكنك إنشاء أرصدة الإجازات لهذا الموظف بناءً على أنواع الإجازات الخاصة بالمطعم.',
  'leaveAssign.fields.leaveType': 'نوع الإجازة',
  'leaveAssign.fields.year': 'السنة',
  'leaveAssign.fields.openingBalance': 'الرصيد الافتتاحي',
  'leaveAssign.fields.assignedDays': 'الأيام المخصصة',
  'leaveAssign.fields.usedDays': 'الأيام المستخدمة',
  'leaveAssign.fields.remainingDays': 'الأيام المتبقية',
  'leaveAssign.fields.status': 'الحالة',
  'leaveAssign.fields.notes': 'ملاحظات',
  'leaveAssign.units.days': 'يوم',
  'leaveAssign.validation.openingBalanceMin': 'يجب أن يكون الرصيد الافتتاحي 0 أو أكثر',
  'leaveAssign.validation.assignedDaysMin': 'يجب أن تكون الأيام المخصصة 0 أو أكثر',
}
