import type { TranslationDictionary } from '../../types'

export const tablesEn: TranslationDictionary = {
  'tables.title': 'Tables',
  'tables.subtitle': 'Manage restaurant tables by branch and section',
  'tables.listTitle': 'Table List',
  'tables.loading': 'Loading tables...',
  'tables.accessDenied': 'You do not have permission to access tables.',

  'tables.actions.add': 'Add Table',
  'tables.actions.saving': 'Saving...',

  'tables.fields.name': 'Name',
  'tables.fields.branch': 'Branch',
  'tables.fields.section': 'Section',
  'tables.fields.capacity': 'Capacity',

  'tables.filters.allSections': 'All sections',
  'tables.filters.noSection': 'No section',

  'tables.empty.title': 'No tables yet',
  'tables.empty.subtitle': 'Add tables to prepare branch floor layouts.',
  'tables.empty.selectBranchTitle': 'Select a branch',
  'tables.empty.selectBranchSubtitle': 'Choose a branch to view its tables.',

  'tables.form.createTitle': 'Add Table',
  'tables.form.editTitle': 'Edit Table',
  'tables.form.selectBranch': 'Select branch',
  'tables.form.loadingBranches': 'Loading branches...',

  'tables.validation.branchRequired': 'Branch is required.',
  'tables.validation.nameRequired': 'Name is required.',
  'tables.validation.capacityMin': 'Capacity must be at least 1.',

  'tables.toast.createSuccess': 'Table created.',
  'tables.toast.updateSuccess': 'Table updated.',
  'tables.toast.activateSuccess': 'Table activated.',
  'tables.toast.deactivateSuccess': 'Table deactivated.',

  'tables.layout.title': 'Table Layout',
  'tables.layout.subtitle': 'Place branch tables on a blank floor grid',
  'tables.layout.open': 'Open Layout',
  'tables.layout.editor': 'Layout Editor',
  'tables.layout.unplaced': 'Unplaced',
  'tables.layout.noUnplaced': 'No unplaced tables',
  'tables.layout.properties': 'Properties',
  'tables.layout.shape': 'Shape',
  'tables.layout.rotate': 'Rotate',
  'tables.layout.selectTable': 'Select a table to edit its shape.',

  'tables.shapes.ROUND': 'Round',
  'tables.shapes.SQUARE': 'Square',
  'tables.shapes.RECTANGLE': 'Rectangle',

  'tables.sections.manage': 'Manage Sections',
  'tables.sections.manageTitle': 'Manage Sections',
  'tables.sections.add': 'Add Section',
  'tables.sections.save': 'Save Section',
  'tables.sections.loading': 'Loading sections...',
  'tables.sections.empty': 'No sections for this branch.',
  'tables.sections.selectBranchFirst': 'Select a branch before managing sections.',
  'tables.sections.fields.name': 'Name',
  'tables.sections.fields.nameAr': 'Arabic Name',
  'tables.sections.validation.nameRequired': 'Section name is required.',
}
