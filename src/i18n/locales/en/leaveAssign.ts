import type { TranslationDictionary } from '../../types'

export const leaveAssignEn: TranslationDictionary = {
  'leaveAssign.title': 'Leave Assign',
  'leaveAssign.subtitle': 'Employee leave balances by leave type and year',
  'leaveAssign.actions.generate': 'Generate Leave Balances',
  'leaveAssign.actions.edit': 'Edit',
  'leaveAssign.actions.save': 'Save Changes',
  'leaveAssign.actions.goToLeaveTypes': 'Go to Leave Types',
  'leaveAssign.actions.manageLeaveTypes': 'Manage Leave Types',
  'leaveAssign.messages.generateSuccess': 'Leave balances generated successfully.',
  'leaveAssign.messages.updateSuccess': 'Leave balance updated successfully.',
  'leaveAssign.errors.load': 'Failed to load leave balances',
  'leaveAssign.errors.generate': 'Failed to generate leave balances',
  'leaveAssign.errors.update': 'Failed to update leave balance',
  'leaveAssign.errors.noActiveLeaveTypes':
    'No active leave types found. Please create leave types first.',
  'leaveAssign.errors.negativeRemaining': 'Assigned days cannot be less than used days.',
  'leaveAssign.errors.forbidden': 'You do not have permission to perform this action.',
  'leaveAssign.empty.title': 'No leave balances found',
  'leaveAssign.empty.subtitle':
    'Generate leave balances for this employee based on your tenant leave types.',
  'leaveAssign.fields.leaveType': 'Leave Type',
  'leaveAssign.fields.year': 'Year',
  'leaveAssign.fields.openingBalance': 'Opening Balance',
  'leaveAssign.fields.assignedDays': 'Assigned Days',
  'leaveAssign.fields.usedDays': 'Used Days',
  'leaveAssign.fields.remainingDays': 'Remaining Days',
  'leaveAssign.fields.status': 'Status',
  'leaveAssign.fields.notes': 'Notes',
  'leaveAssign.units.days': 'days',
  'leaveAssign.validation.openingBalanceMin': 'Opening balance must be 0 or greater',
  'leaveAssign.validation.assignedDaysMin': 'Assigned days must be 0 or greater',
}
