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
  'errors.ORDER_CONSUMPTION_PENDING_DOC_RACE_LOST':
    'Another order created the pending consumption document first; please retry the operation.',
  'errors.ORDER_CONSUMPTION_RECIPE_NOT_RESOLVED':
    'An order line has no frozen recipe reference (order {{orderId}}, line {{orderLineId}}).',
  'errors.ORDER_CONSUMPTION_RECIPE_HAS_NO_ITEMS':
    'Recipe {{recipeId}} has no material items and cannot be consumed.',
  'errors.ORDER_CONSUMPTION_MIXED_UOM':
    'Material {{materialId}} appears with multiple units in order consumption; use one unit per material.',
  'errors.ORDER_CONSUMPTION_ERROR_SERIALIZATION_FAILED':
    'Could not save order consumption error details. Please retry.',
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

  // RBAC module
  'errors.BRANCH_REQUIRED_FOR_ROLE': 'Role {{roleName}} requires selecting a branch',
  'errors.BRANCH_NOT_ALLOWED_FOR_ROLE': 'Role {{roleName}} cannot be assigned to a branch',

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
  'errors.VARIANT_CANNOT_BE_MENU_ITEM':
    'A variant cannot be shown on the menu directly. Remove it from the menu, then try again.',
  'errors.PARENT_PRODUCT_NOT_ORDERABLE':
    'This is a variant group and cannot be ordered directly. Please choose one of its variants.',
  'errors.PARENT_PRODUCT_HAS_NO_RECIPE':
    'This product groups variants and cannot have its own recipe. Add recipes to its variants instead.',
  'errors.PRODUCT_WITH_RECIPE_CANNOT_BE_PARENT':
    'This product already has a recipe, so it cannot become a variant group.',
  'errors.PRODUCT_HAS_VARIANTS':
    'This product has variants linked to it. Unlink all variants first before deleting.',
  'errors.PRODUCT_NOT_FOUND': 'Product not found.',
  'errors.ADDON_HOST_MUST_BE_PARENT_ELIGIBLE':
    'Add-ons can only be attached to top-level products, not to a variant.',
  'errors.ADDON_CANNOT_BE_SELF': 'A product cannot be added as its own add-on.',
  'errors.DUPLICATE_ADD_ON': 'This add-on is already linked to the product.',

  // Orders module
  'errors.PRODUCT_HAS_NO_ACTIVE_RECIPE':
    "This product has no active recipe and can't be ordered yet. Please set up a recipe for it first.",
  'errors.WAREHOUSE_NOT_FOUND': 'No active warehouse is configured for this branch.',
  'errors.AMBIGUOUS_WAREHOUSE_FOR_BRANCH':
    'More than one warehouse is configured for this branch ({{warehouseCount}} found).',

  // Assets module
  'errors.LINE_ASSET_MISMATCH':
    'Asset line {{assetLineId}} does not belong to asset {{assetId}}.',

  // Devices module
  'errors.INVALID_DEVICE_SECRET': 'Invalid device secret',
  'errors.DEVICE_INACTIVE': 'This device is inactive ({{entityType}} #{{entityId}})',
  'errors.DEVICE_NOT_FOUND': 'The requested device was not found ({{entityType}} #{{entityId}})',
  'errors.BRANCH_NOT_FOUND': 'The selected branch was not found ({{entityType}} #{{entityId}})',

  // Auth
  'errors.INVALID_CREDENTIALS':
    'Invalid credentials, check the restaurant code, username, and password',
  'errors.POS_LOGIN_NOT_PERMITTED': 'This user is not allowed to open shifts on a POS device',
  'errors.DEVICE_BRANCH_MISMATCH': 'This user is not assigned to the selected POS device branch',
}
