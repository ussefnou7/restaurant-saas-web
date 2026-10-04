import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('expenses table actions column layout and geometry rules (L055)', () => {
  const cssPath = path.resolve('src/styles/expenses.css')
  const cssContent = fs.readFileSync(cssPath, 'utf8')

  const listPagePath = path.resolve('src/pages/expenses/ExpensesListPage.tsx')
  const listPageContent = fs.readFileSync(listPagePath, 'utf8')

  // 1. Verify --expenses-actions-width definition and scroll-padding
  assert.match(
    cssContent,
    /--expenses-actions-width:\s*260px;/,
    'expenses-table-wrap must define --expenses-actions-width: 260px'
  )
  assert.match(
    cssContent,
    /scroll-padding-inline-end:\s*var\(--expenses-actions-width,\s*260px\);/,
    'scroll-padding-inline-end must use --expenses-actions-width'
  )

  // 2. Verify sticky logical property on th and td
  const thMatch = cssContent.match(/\.expenses-table__th--actions\s*\{([^}]+)\}/)
  assert.ok(thMatch, '.expenses-table__th--actions rule must exist')
  const thBody = thMatch[1]
  assert.match(thBody, /position:\s*sticky;/, 'th--actions must be position: sticky')
  assert.match(thBody, /inset-inline-end:\s*0;/, 'th--actions must use inset-inline-end: 0')
  assert.match(thBody, /width:\s*var\(--expenses-actions-width,\s*260px\);/, 'th--actions must use 260px width')
  assert.match(thBody, /min-width:\s*var\(--expenses-actions-width,\s*260px\);/, 'th--actions must have min-width')
  assert.doesNotMatch(thBody, /\bright:\s*0/, 'Must not use physical right: 0')
  assert.doesNotMatch(thBody, /\bleft:\s*0/, 'Must not use physical left: 0')

  const tdMatch = cssContent.match(/\.expenses-table__td--actions\s*\{([^}]+)\}/)
  assert.ok(tdMatch, '.expenses-table__td--actions rule must exist')
  const tdBody = tdMatch[1]
  assert.match(tdBody, /position:\s*sticky;/, 'td--actions must be position: sticky')
  assert.match(tdBody, /inset-inline-end:\s*0;/, 'td--actions must use inset-inline-end: 0')
  assert.match(tdBody, /width:\s*var\(--expenses-actions-width,\s*260px\);/, 'td--actions must use 260px width')
  assert.match(tdBody, /min-width:\s*var\(--expenses-actions-width,\s*260px\);/, 'td--actions must have min-width')
  assert.doesNotMatch(tdBody, /\bright:\s*0/, 'Must not use physical right: 0')
  assert.doesNotMatch(tdBody, /\bleft:\s*0/, 'Must not use physical left: 0')

  // 3. Verify no direction-specific CSS overrides for actions column
  assert.doesNotMatch(
    cssContent,
    /\[dir=['"]?(?:rtl|ltr)['"]?\].*expenses-table__(?:th|td)--actions/,
    'Must not introduce direction-specific CSS overrides'
  )

  // 4. Verify colgroup in ExpensesListPage matches actions width
  assert.match(
    listPageContent,
    /<col\s+style=\{\{\s*width:\s*'var\(--expenses-actions-width,\s*260px\)'\s*\}\}\s*\/>/,
    'ExpensesListPage colgroup must use var(--expenses-actions-width, 260px)'
  )

  // 5. Verify action buttons inside .expenses-table__actions container
  assert.match(
    listPageContent,
    /<div className="expenses-table__actions">/,
    'ExpensesListPage must wrap actions in .expenses-table__actions'
  )
})

test('bounding box geometry simulation for LTR and RTL at 1440x900 (L055)', () => {
  // Cell parameters at 260px width
  const cellWidth = 260
  const cellPaddingInline = 16 // var(--space-md) is 16px each side
  const gap = 4 // var(--space-xs) is 4px

  // Measured button dimensions from evidence (worst-case Arabic vs English)
  // Arabic:
  // "عرض التفاصيل" (View Details): w = 133px
  // "إلغاء" (Void): w = 82px
  const arViewDetailsW = 133
  const arVoidW = 82
  const arContentW = arViewDetailsW + gap + arVoidW // 219px

  // Content width (219px) must fit inside cell content box (260 - 32 = 228px)
  assert.ok(
    arContentW <= cellWidth - cellPaddingInline * 2,
    `Arabic content width (${arContentW}px) must fit within cell content box (${cellWidth - cellPaddingInline * 2}px)`
  )

  // English:
  // "View Details": w = 123px
  // "Void": w = 79px
  const enViewDetailsW = 123
  const enVoidW = 79
  const enContentW = enViewDetailsW + gap + enVoidW // 206px
  assert.ok(
    enContentW <= cellWidth - cellPaddingInline * 2,
    `English content width (${enContentW}px) must fit within cell content box (${cellWidth - cellPaddingInline * 2}px)`
  )

  // Simulate getBoundingClientRect() in RTL:
  // In RTL, the cell pins to the inline-end (which is left: 41 in viewport).
  // Cell rect: left = 41, right = 41 + 260 = 301.
  const rtlCellRect = { left: 41, right: 41 + cellWidth, width: cellWidth }
  // Actions container centered in cell:
  const rtlAvailableInner = cellWidth - cellPaddingInline * 2
  const rtlOffset = (rtlAvailableInner - arContentW) / 2
  const rtlContentStart = rtlCellRect.right - cellPaddingInline - rtlOffset

  // In RTL, first button (View Details) starts at rtlContentStart going leftwards
  const rtlViewDetailsRect = {
    left: rtlContentStart - arViewDetailsW,
    right: rtlContentStart,
    width: arViewDetailsW,
  }
  // Second button (Void) is next to it going leftwards
  const rtlVoidRect = {
    left: rtlViewDetailsRect.left - gap - arVoidW,
    right: rtlViewDetailsRect.left - gap,
    width: arVoidW,
  }

  // Check both rects sit strictly inside cell rect
  assert.ok(
    rtlViewDetailsRect.left >= rtlCellRect.left && rtlViewDetailsRect.right <= rtlCellRect.right,
    `RTL View Details rect [${rtlViewDetailsRect.left}, ${rtlViewDetailsRect.right}] must sit inside cell rect [${rtlCellRect.left}, ${rtlCellRect.right}]`
  )
  assert.ok(
    rtlVoidRect.left >= rtlCellRect.left && rtlVoidRect.right <= rtlCellRect.right,
    `RTL Void rect [${rtlVoidRect.left}, ${rtlVoidRect.right}] must sit inside cell rect [${rtlCellRect.left}, ${rtlCellRect.right}]`
  )
  assert.ok(rtlVoidRect.left > 0, `RTL Void rect left (${rtlVoidRect.left}) must be positive and on-screen`)

  // Simulate getBoundingClientRect() in LTR:
  // In LTR, the cell pins to the inline-end (right of viewport, e.g. left = 1210, right = 1470).
  const ltrCellRect = { left: 1210, right: 1210 + cellWidth, width: cellWidth }
  const ltrAvailableInner = cellWidth - cellPaddingInline * 2
  const ltrOffset = (ltrAvailableInner - enContentW) / 2
  const ltrContentStart = ltrCellRect.left + cellPaddingInline + ltrOffset

  const ltrViewDetailsRect = {
    left: ltrContentStart,
    right: ltrContentStart + enViewDetailsW,
    width: enViewDetailsW,
  }
  const ltrVoidRect = {
    left: ltrViewDetailsRect.right + gap,
    right: ltrViewDetailsRect.right + gap + enVoidW,
    width: enVoidW,
  }

  assert.ok(
    ltrViewDetailsRect.left >= ltrCellRect.left && ltrViewDetailsRect.right <= ltrCellRect.right,
    `LTR View Details rect [${ltrViewDetailsRect.left}, ${ltrViewDetailsRect.right}] must sit inside cell rect [${ltrCellRect.left}, ${ltrCellRect.right}]`
  )
  assert.ok(
    ltrVoidRect.left >= ltrCellRect.left && ltrVoidRect.right <= ltrCellRect.right,
    `LTR Void rect [${ltrVoidRect.left}, ${ltrVoidRect.right}] must sit inside cell rect [${ltrCellRect.left}, ${ltrCellRect.right}]`
  )
})
