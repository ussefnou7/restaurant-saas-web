import type { TranslationDictionary } from '../../types'

export const usersEn: TranslationDictionary = {
  'users.title': 'Users',
  'users.subtitle': 'Manage users and access',
  'users.add': 'Add User',
  'users.listTitle': 'Users List',
  'users.listSubtitle': 'Manage accounts, roles, and permissions',
  'users.searchPlaceholder': 'Search users',
  'users.filterStatus': 'Filter by status',
  'users.filterRole': 'Filter by role',
  'users.permissions': 'Permissions',
  'users.totalUsers': 'Total Users',
  'users.loading': 'Loading users…',
  'users.emptyTitle': 'No users yet',
  'users.emptyText': 'Create your first user account to manage access.',
  'users.loadError': 'Failed to load users',
  'users.statusError': 'Failed to update user status',
  'users.deleteError': 'Failed to delete user',
  'users.col.user': 'User',
  'users.col.role': 'Role',
  'users.col.branch': 'Branch',

  'users.details.backToList': 'Back to users',
  'users.details.tab.overview': 'Overview',
  'users.details.tab.permissions': 'Permissions',
  'users.details.editUser': 'Edit User',
  'users.details.notFound': 'User not found.',
  'users.details.notFoundTitle': 'User not found',

  'users.deleteConfirm.title': 'Delete User',
  'users.deleteConfirm.message':
    'Are you sure you want to delete this user? This action cannot be undone.',
  'users.deleteConfirm.confirm': 'Delete User',

  'users.modal.addTitle': 'Add User',
  'users.modal.addSubtitle': 'Create a new restaurant user and assign access.',
  'users.modal.editTitle': 'Edit User',
  'users.modal.editSubtitle': 'Update user information and access.',

  'users.sections.basicInfo': 'Basic Information',
  'users.sections.access': 'Access',
  'users.sections.status': 'Status',

  'users.fields.fullName': 'Full Name',
  'users.fields.username': 'Username',
  'users.fields.password': 'Password',
  'users.fields.phone': 'Phone',
  'users.fields.role': 'Role',
  'users.fields.branch': 'Branch',
  'users.fields.active': 'Active user',

  'users.placeholders.fullName': 'John Doe',
  'users.placeholders.username': 'admin',
  'users.placeholders.password': '••••••••',
  'users.placeholders.phone': '+201000000000',
  'users.placeholders.selectRole': 'Select a role',
  'users.placeholders.selectBranch': 'Select branch',
  'users.placeholders.noBranch': 'No branch / tenant-wide access',
  'users.placeholders.loadingBranches': 'Loading branches…',

  'users.helpers.branch': 'Leave empty for tenant-wide access.',
  'users.helpers.active': 'Inactive users cannot access the system.',

  'users.actions.create': 'Create User',
  'users.actions.save': 'Save Changes',
  'users.actions.creating': 'Creating…',
  'users.actions.saving': 'Saving…',

  'users.form.loadingBranches': 'Loading branches…',

  'users.validation.usernameRequired': 'Username is required',
  'users.validation.fullNameRequired': 'Full name is required',
  'users.validation.passwordRequired': 'Password is required',
  'users.validation.roleRequired': 'Role is required',

  'users.errors.loadBranches': 'Failed to load branches',
  'users.errors.create': 'Failed to create user',
  'users.errors.update': 'Failed to update user',

  'users.roles.OWNER': 'Owner',
  'users.roles.BRANCH_MANAGER': 'Branch Manager',
  'users.roles.CASHIER': 'Cashier',
  'users.roles.ACCOUNTANT': 'Accountant',
  'users.roles.HR_MANAGER': 'HR Manager',
  'users.roles.INVENTORY_MANAGER': 'Inventory Manager',
}
