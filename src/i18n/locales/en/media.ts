import type { TranslationDictionary } from '../../types'

export const mediaEn: TranslationDictionary = {
  'media.image.label': 'Image',
  'media.photo.label': 'Photo',
  'media.upload': 'Upload',
  'media.replace': 'Replace',
  'media.remove': 'Remove',
  'media.viewFull': 'View full size',
  'media.fullSizeTitle': 'Image Preview',
  'media.uploading': 'Uploading…',
  'media.loading': 'Loading image…',
  'media.empty': 'No image yet',
  'media.emptyHint': 'JPG, PNG or WebP, up to {{maxMb}} MB',
  'media.dropHint': 'Drop an image here or choose a file',
  'media.previewAlt': 'Attached image',
  'media.loadFailed': 'This image could not be loaded',
  'media.removeConfirmTitle': 'Remove this image?',
  'media.removeConfirmText':
    'The file is deleted permanently. There is no version history and it cannot be restored.',
  'media.removeConfirmAction': 'Remove permanently',
  'media.replaceWarning': 'Uploading a new image permanently deletes the current one.',
  'media.tooLargeClient': 'This file is {{sizeMb}} MB. The limit is {{maxMb}} MB.',
  'media.wrongTypeClient': 'Only JPG, PNG and WebP images can be uploaded.',

  // Backend error codes — rendered through translateApiError, never from the server message.
  'errors.MEDIA_NOT_FOUND': 'This image no longer exists.',
  'errors.MEDIA_VARIANT_NOT_FOUND': 'This image size is not available.',
  'errors.MEDIA_OWNER_NOT_FOUND': 'The record this image belongs to was not found.',
  'errors.MEDIA_OWNER_IMMUTABLE':
    'This record is final, so its attachments can only be added to, not removed.',
  'errors.MEDIA_FILE_EMPTY': 'The selected file is empty.',
  'errors.MEDIA_UNSUPPORTED_CONTENT_TYPE':
    'That file type cannot be uploaded. Use a JPG, PNG or WebP image.',
  'errors.MEDIA_HEIC_NOT_SUPPORTED':
    'HEIC photos are not supported. On iPhone, set Camera → Formats to “Most Compatible”, or share the photo as JPEG first.',
  'errors.MEDIA_FILE_TOO_LARGE': 'This file is too large. The limit is {{maxSizeBytes}} bytes.',
  'errors.MEDIA_IMAGE_UNREADABLE': 'This file could not be read as an image. It may be damaged.',
  'errors.MEDIA_STORAGE_FAILURE': 'The image could not be saved. Please try again.',
}
