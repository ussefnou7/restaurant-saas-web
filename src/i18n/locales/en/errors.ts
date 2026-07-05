import type { TranslationDictionary } from '../../types'

export const errorsEn: TranslationDictionary = {
  // Inventory module
  'errors.INVALID_STATE_TRANSITION':
    'This action cannot be performed: current status is {{currentStatus}}, but it requires status {{requiredStatus}}',
  'errors.RESOURCE_NOT_FOUND': 'The requested item was not found ({{entityType}} #{{entityId}})',
  'errors.DUPLICATE_OPERATION':
    'This operation has already been performed and cannot be repeated ({{entityType}} #{{entityId}})',
  'errors.ALREADY_PROCESSED':
    'This item has already been processed; the action ({{action}}) cannot be performed again',
  'errors.INSUFFICIENT_STOCK':
    'Insufficient stock for {{materialName}}: available {{available}}, requested {{requested}}',
  'errors.BATCH_SHORTFALL':
    'Not enough quantity left in the batch for {{materialName}}: available in batch {{availableInBatch}}, requested {{requested}}',
  'errors.FREEZE_CONFLICT':
    'This operation cannot proceed because an open physical count includes the following materials:',
  'errors.FREEZE_CONFLICT.item': '{{materialName}} (count {{conflictingCountCode}})',
  'errors.RETURN_QUANTITY_EXCEEDED':
    'Return quantity for {{materialName}} exceeds the returnable quantity: returnable {{returnable}}, requested {{requested}}',
  'errors.WASTE_NOT_ALLOWED_POSITIVE_VARIANCE':
    'Waste cannot be recorded for {{materialName}} because the count variance is positive',
  'errors.UOM_CONVERSION_FAILED': 'Failed to convert from unit {{fromUom}} to unit {{toUom}}',
  'errors.EMPTY_DOCUMENT_LINES': 'This operation cannot proceed: the document has no lines',
  'errors.RESOURCE_NOT_AVAILABLE_FOR_TENANT':
    'The requested item is not available to your account ({{entityType}} #{{entityId}})',
  'errors.DUPLICATE_CODE': "A {{entityType}} with code '{{code}}' already exists",
  'errors.CODE_IMMUTABLE': 'The code cannot be changed after the {{entityType}} is created',
  'errors.UOM_IN_USE': 'This unit of measure is in use and cannot be deleted',
  'errors.GLOBAL_UOM_NOT_DELETABLE':
    'Global units of measure cannot be deleted, only deactivated',
  'errors.UNPOST_BLOCKED_HAS_RETURN':
    'Cannot unpost: a purchase return is linked to this invoice ({{returnCodes}}). Unpost the return first.',
  'errors.UNPOST_BLOCKED_ORIGINAL_INVOICE_NOT_POSTED':
    'Cannot unpost return: the original invoice ({{originalInvoiceId}}) is no longer posted (current status: {{originalInvoiceStatus}}).',
  'errors.UNPOST_BLOCKED_BATCH_CONSUMED':
    'Cannot unpost: stock was consumed from the following item batches',
  'errors.UNPOST_BLOCKED_BATCH_CONSUMED.item':
    '{{materialName}} — batch {{batchId}} (consumed {{consumedQuantity}})',
  'errors.VALIDATION_FAILED': 'Some fields contain invalid values, please review them',
  'errors.VALIDATION_FAILED.field': 'Invalid value ({{constraint}})',
  'errors.VALIDATION_FAILED.fieldGeneric': 'Invalid value',

  // HR / Users / Branches / Jobs (shared HrErrorCode)
  'errors.INACTIVE_REFERENCE': 'The referenced item is inactive ({{entityType}} #{{entityId}})',
  'errors.DEACTIVATION_BLOCKED':
    'Cannot deactivate {{entityType}} #{{entityId}} because it is linked to {{blockedByEntityType}}',
  'errors.SELF_ACTION_BLOCKED': 'You cannot perform this action ({{action}}) on your own account',
  'errors.NOT_ALLOWED_FOR_ROLE': 'This action is not allowed for role ({{roleCode}})',
  'errors.BRANCH_SCOPE_REQUIRED': 'A branch scope is required to perform this action',
  'errors.TENANT_CONTEXT_REQUIRED': 'A tenant context is required to perform this action',
  'errors.UNSUPPORTED_OPERATION':
    'Requested status ({{requestedStatus}}) is not supported; allowed: {{allowedStatuses}}',
  'errors.INSUFFICIENT_LEAVE_BALANCE':
    'Insufficient leave balance: remaining {{remaining}}, requested {{requested}}',
  'errors.NO_ACTIVE_LEAVE_TYPES':
    'No active leave types exist for this tenant, please create leave types first',
  'errors.NEGATIVE_REMAINING_BALANCE':
    'Leave remaining balance cannot be negative ({{remainingDays}})',
  'errors.SYSTEM_TENANT_RESTRICTED':
    'This action ({{action}}) is not allowed in the system tenant context',

  // Common / cross-module
  'errors.DATA_INTEGRITY_VIOLATION':
    'The operation could not be completed because the data is linked to other records',
  'errors.ACCESS_DENIED': 'You do not have permission to perform this action',
  'errors.INTERNAL_ERROR': 'A server error occurred, please try again later',
  'errors.LEGACY_ERROR': 'An error occurred while performing the operation, please try again',
  'errors.GENERIC_ERROR': 'An unexpected error occurred, please try again',

  // Menu module
  'errors.CATEGORY_HAS_PRODUCTS':
    'This category cannot be deleted because it still has products assigned to it',
  'errors.DUPLICATE_MATERIAL_IN_RECIPE':
    'The material "{{materialName}}" is already included in this recipe',

  // Auth
  'errors.INVALID_CREDENTIALS':
    'Invalid credentials, check the restaurant code, username, and password',
}
