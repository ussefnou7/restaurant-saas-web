import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { en } from '../src/i18n/locales/en/index.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'
import { getOrderTypeLabel } from '../src/utils/orderDisplay.ts'
import type { TranslationKey } from '../src/i18n/types.ts'

test('all required i18n keys for L045 exist in both locales without raw fallbacks', () => {
  const keysToCheck = [
    'common.accessDenied',
    'inventory.purchase.lines.notes',
    'orders.type.DINE_IN',
    'orders.type.TAKEAWAY',
    'orders.type.DELIVERY',
    'orders.orderType.DINE_IN',
    'orders.orderType.TAKEAWAY',
    'orders.orderType.DELIVERY',
  ] as const

  for (const key of keysToCheck) {
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
    assert.notEqual(
      enVal,
      key,
      `English value should not be identical to raw key for: "${key}"`
    )
    assert.notEqual(
      arVal,
      key,
      `Arabic value should not be identical to raw key for: "${key}"`
    )
  }

  // Check specific values
  assert.equal((en as Record<string, string>)['common.accessDenied'], 'Access Denied')
  assert.equal((ar as Record<string, string>)['common.accessDenied'], 'تم رفض الوصول')

  assert.equal((en as Record<string, string>)['inventory.purchase.lines.notes'], 'Notes')
  assert.equal((ar as Record<string, string>)['inventory.purchase.lines.notes'], 'ملاحظات')
})

test('getOrderTypeLabel resolves to translated strings in both en and ar', () => {
  const createMockT = (dict: Record<string, string>) => {
    return (key: TranslationKey): string => {
      return dict[key] || key
    }
  }

  const enT = createMockT(en as Record<string, string>)
  const arT = createMockT(ar as Record<string, string>)

  // DINE_IN
  assert.equal(getOrderTypeLabel('DINE_IN', enT), 'Dine in')
  assert.equal(getOrderTypeLabel('DINE_IN', arT), 'تناول في المطعم')

  // TAKEAWAY
  assert.equal(getOrderTypeLabel('TAKEAWAY', enT), 'Takeaway')
  assert.equal(getOrderTypeLabel('TAKEAWAY', arT), 'تيك أواي')

  // DELIVERY
  assert.equal(getOrderTypeLabel('DELIVERY', enT), 'Delivery')
  assert.equal(getOrderTypeLabel('DELIVERY', arT), 'توصيل')
})

test('expenses.categories.globalReadOnlyNotice has zero occurrences in src codebase (L045 judgement call)', () => {
  const srcDir = path.resolve('src')

  function scanDir(dir: string): string[] {
    const results: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...scanDir(fullPath))
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        results.push(fullPath)
      }
    }
    return results
  }

  const files = scanDir(srcDir)
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    assert.ok(
      !content.includes('globalReadOnlyNotice'),
      `Dead concept globalReadOnlyNotice found in ${file}`
    )
  }
})

test('Sales reports use getOrderTypeLabel for filterSentence and select options (L045)', () => {
  const reportFiles = [
    'src/pages/sales/reports/SalesByHourReport.tsx',
    'src/pages/sales/reports/SalesByProductReport.tsx',
    'src/pages/sales/reports/SalesOverTimeReport.tsx',
    'src/pages/sales/reports/SalesByPaymentMethodReport.tsx',
  ]

  for (const relPath of reportFiles) {
    const fullPath = path.resolve(relPath)
    const content = fs.readFileSync(fullPath, 'utf8')

    // Must import getOrderTypeLabel
    assert.match(
      content,
      /import.*getOrderTypeLabel.*from/,
      `${relPath} must import getOrderTypeLabel`
    )

    // filterSentence must use getOrderTypeLabel(urlOrderType, t)
    assert.match(
      content,
      /urlOrderType \? getOrderTypeLabel\(urlOrderType, t\) : t\('reports\.filters\.allOrderTypes'\)/,
      `${relPath} filterSentence must use getOrderTypeLabel(urlOrderType, t)`
    )

    // Must use getOrderTypeLabel for select options
    assert.match(
      content,
      /<option value="DINE_IN">\{getOrderTypeLabel\('DINE_IN', t\)\}<\/option>/,
      `${relPath} must use getOrderTypeLabel for DINE_IN option`
    )
    assert.match(
      content,
      /<option value="TAKEAWAY">\{getOrderTypeLabel\('TAKEAWAY', t\)\}<\/option>/,
      `${relPath} must use getOrderTypeLabel for TAKEAWAY option`
    )
    assert.match(
      content,
      /<option value="DELIVERY">\{getOrderTypeLabel\('DELIVERY', t\)\}<\/option>/,
      `${relPath} must use getOrderTypeLabel for DELIVERY option`
    )
  }
})

test('all literal t(\'...\') keys in affected expense and sales report files exist in both dictionaries', () => {
  const targetFiles = [
    'src/pages/expenses/ExpenseCategoriesPage.tsx',
    'src/pages/expenses/ExpenseCreatePage.tsx',
    'src/pages/expenses/ExpenseDetailPage.tsx',
    'src/pages/expenses/ExpensesListPage.tsx',
    'src/pages/sales/reports/SalesByHourReport.tsx',
    'src/pages/sales/reports/SalesByProductReport.tsx',
    'src/pages/sales/reports/SalesOverTimeReport.tsx',
    'src/pages/sales/reports/SalesByPaymentMethodReport.tsx',
  ]

  const tCallRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*[,)]/g

  for (const relPath of targetFiles) {
    const fullPath = path.resolve(relPath)
    const content = fs.readFileSync(fullPath, 'utf8')
    let match: RegExpExecArray | null

    while ((match = tCallRegex.exec(content)) !== null) {
      const key = match[1]
      const enVal = (en as Record<string, string>)[key]
      const arVal = (ar as Record<string, string>)[key]

      assert.ok(
        typeof enVal === 'string' && enVal.trim().length > 0,
        `Key "${key}" found in ${relPath} missing from English dictionary`
      )
      assert.ok(
        typeof arVal === 'string' && arVal.trim().length > 0,
        `Key "${key}" found in ${relPath} missing from Arabic dictionary`
      )
    }
  }
})

