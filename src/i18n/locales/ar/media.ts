import type { TranslationDictionary } from '../../types'

export const mediaAr: TranslationDictionary = {
  'media.image.label': 'الصورة',
  'media.photo.label': 'الصورة الشخصية',
  'media.upload': 'رفع',
  'media.replace': 'استبدال',
  'media.remove': 'حذف',
  'media.viewFull': 'عرض بالحجم الكامل',
  'media.fullSizeTitle': 'معاينة الصورة',
  'media.uploading': 'جارٍ الرفع…',
  'media.loading': 'جارٍ تحميل الصورة…',
  'media.empty': 'لا توجد صورة',
  'media.emptyHint': 'JPG أو PNG أو WebP، بحد أقصى {{maxMb}} ميجابايت',
  'media.dropHint': 'أفلت صورة هنا أو اختر ملفًا',
  'media.previewAlt': 'الصورة المرفقة',
  'media.loadFailed': 'تعذر تحميل هذه الصورة',
  'media.removeConfirmTitle': 'حذف هذه الصورة؟',
  'media.removeConfirmText': 'سيتم حذف الملف نهائيًا. لا يوجد سجل نسخ ولا يمكن استرجاعه.',
  'media.removeConfirmAction': 'حذف نهائي',
  'media.replaceWarning': 'رفع صورة جديدة يحذف الصورة الحالية نهائيًا.',
  'media.tooLargeClient': 'حجم هذا الملف {{sizeMb}} ميجابايت، والحد الأقصى {{maxMb}} ميجابايت.',
  'media.wrongTypeClient': 'يمكن رفع صور JPG وPNG وWebP فقط.',

  // أكواد أخطاء الخادم — تُعرض عبر translateApiError وليس من رسالة الخادم.
  'errors.MEDIA_NOT_FOUND': 'لم تعد هذه الصورة موجودة.',
  'errors.MEDIA_VARIANT_NOT_FOUND': 'هذا المقاس من الصورة غير متاح.',
  'errors.MEDIA_OWNER_NOT_FOUND': 'لم يتم العثور على السجل التابعة له هذه الصورة.',
  'errors.MEDIA_OWNER_IMMUTABLE': 'هذا السجل نهائي، لذا يمكن الإضافة إلى مرفقاته دون حذفها.',
  'errors.MEDIA_FILE_EMPTY': 'الملف المختار فارغ.',
  'errors.MEDIA_UNSUPPORTED_CONTENT_TYPE':
    'لا يمكن رفع هذا النوع من الملفات. استخدم صورة JPG أو PNG أو WebP.',
  'errors.MEDIA_HEIC_NOT_SUPPORTED':
    'صور HEIC غير مدعومة. من إعدادات الآيفون: الكاميرا ← التنسيقات ← «الأكثر توافقًا»، أو شارك الصورة بصيغة JPEG أولًا.',
  'errors.MEDIA_FILE_TOO_LARGE': 'هذا الملف كبير جدًا. الحد الأقصى {{maxSizeBytes}} بايت.',
  'errors.MEDIA_IMAGE_UNREADABLE': 'تعذرت قراءة هذا الملف كصورة، وقد يكون تالفًا.',
  'errors.MEDIA_STORAGE_FAILURE': 'تعذر حفظ الصورة. حاول مرة أخرى.',
}
