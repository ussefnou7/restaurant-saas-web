import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { en } from '../src/i18n/locales/en/index.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'

test('all required i18n keys for empty expense category state exist in both locales (L056)', () => {
  const requiredKeys = [
    'expenses.create.noCategoriesTitle',
    'expenses.create.noCategoriesDescription',
    'expenses.create.noCategoriesMessage',
    'expenses.create.createCategoryLink',
    'expenses.create.createCategoryAction',
    'expenses.create.noCategoriesPermissionHint',
  ] as const

  for (const key of requiredKeys) {
    const enVal = (en as Record<string, string>)[key]
    const arVal = (ar as Record<string, string>)[key]

    assert.ok(
      typeof enVal === 'string' && enVal.trim().length > 0,
      `English translation missing or empty for key: "${key}"`
    )
    assert.ok(
      typeof arVal === 'string' && arVal.trim().length > 0,
      `Arabic translation missing or empty for key: "${key}"`
    )
  }
})

test('ExpenseCreatePage implements empty category state, permission gating, and disabled submit (L056)', () => {
  const pagePath = path.resolve('src/pages/expenses/ExpenseCreatePage.tsx')
  const pageContent = fs.readFileSync(pagePath, 'utf8')

  // 1. Hook and component imports
  assert.match(
    pageContent,
    /useCanManageExpenseCategories/,
    'ExpenseCreatePage must import useCanManageExpenseCategories'
  )
  assert.match(
    pageContent,
    /import.*Link.*from 'react-router-dom'/,
    'ExpenseCreatePage must import Link from react-router-dom'
  )

  // 2. Loading state tracked for categories
  assert.match(
    pageContent,
    /const \[loadingCategories, setLoadingCategories\] = useState\(true\)/,
    'ExpenseCreatePage must track loading state for categories'
  )

  // 3. hasCategories logic
  assert.match(
    pageContent,
    /const hasCategories = activeCategories\.length > 0/,
    'ExpenseCreatePage must derive hasCategories from active categories'
  )

  // 4. Banner when empty
  assert.match(
    pageContent,
    /!loadingCategories && !hasCategories/,
    'ExpenseCreatePage must check !loadingCategories && !hasCategories'
  )
  assert.match(
    pageContent,
    /className="expense-category-empty-banner"/,
    'ExpenseCreatePage must render expense-category-empty-banner'
  )

  // 5. Permission gating for create link
  assert.match(
    pageContent,
    /canManageCategories \? \(\s*<Link\s+to="\/expenses\/categories"/,
    'ExpenseCreatePage must link to /expenses/categories when canManageCategories is true'
  )
  assert.match(
    pageContent,
    /noCategoriesPermissionHint/,
    'ExpenseCreatePage must show permission hint when user cannot manage categories'
  )

  // 6. Submit button disabled when no categories
  assert.match(
    pageContent,
    /disabled=\{submitting \|\| \(!loadingCategories && !hasCategories\)\}/,
    'Submit button must be disabled when there are no categories'
  )

  // 7. Validation rejects submission when no categories
  assert.match(
    pageContent,
    /if \(!loadingCategories && !hasCategories\) \{/,
    'Validation must fail when there are no categories'
  )
})

test('expenses.css has styling for category empty banner and field box (L056)', () => {
  const cssPath = path.resolve('src/styles/expenses.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  assert.match(
    cssContent,
    /\.expense-category-empty-banner\s*\{/,
    'expenses.css must define .expense-category-empty-banner'
  )
  assert.match(
    cssContent,
    /\.expense-category-field-empty\s*\{/,
    'expenses.css must define .expense-category-field-empty'
  )

  // Verify logical properties used
  assert.match(
    cssContent,
    /\.expense-category-empty-banner[\s\S]*?margin-block-end:/,
    '.expense-category-empty-banner should use logical margin-block-end'
  )
})
