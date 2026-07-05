import type { TranslationKey, TranslationValues } from '../i18n/types'
import type { PurchaseInvoiceStatus, PurchasePaymentStatus } from '../types/purchaseInvoice'
import type { PurchaseReturnReason } from '../types/purchaseReturn'

type TranslateFn = (key: TranslationKey, values?: TranslationValues) => string

export function getPurchaseInvoiceStatusLabel(
  status: PurchaseInvoiceStatus,
  t: TranslateFn,
): string {
  return t(`inventory.purchase.status.${status}`)
}

export function getPurchasePaymentStatusLabel(
  status: PurchasePaymentStatus,
  t: TranslateFn,
): string {
  return t(`inventory.purchase.paymentStatus.${status}`)
}

export function getPurchaseInvoiceStatusBadgeVariant(
  status: PurchaseInvoiceStatus,
): 'success' | 'warning' | 'danger' | 'muted' | 'primary' {
  switch (status) {
    case 'DRAFT':
      return 'muted'
    case 'COMPLETE':
      return 'primary'
    case 'POSTED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'muted'
  }
}

export function getPurchasePaymentStatusBadgeVariant(
  status: PurchasePaymentStatus,
): 'success' | 'warning' | 'danger' | 'muted' {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'PARTIAL':
      return 'warning'
    case 'UNPAID':
      return 'danger'
    default:
      return 'muted'
  }
}

export function getPurchaseReturnReasonLabel(reason: PurchaseReturnReason, t: TranslateFn): string {
  return t(`inventory.purchaseReturn.reason.${reason}`)
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calcLineTotal(quantity: number, unitCost: number): number {
  const q = Number.isFinite(quantity) ? quantity : 0
  const c = Number.isFinite(unitCost) ? unitCost : 0
  return roundMoney(q * c)
}

export function calcLineSubtotal(quantity: number, unitCost: number): number {
  return calcLineTotal(quantity, unitCost)
}

export function amountFromPercent(base: number, percent: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0
  const pct = Number.isFinite(percent) ? percent : 0
  return roundMoney(base * (pct / 100))
}

export function percentFromAmount(base: number, amount: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0
  const amt = Number.isFinite(amount) ? amount : 0
  return roundMoney((amt / base) * 100)
}

export function calcNetLineTotal(lineSubtotal: number, discountAmount: number): number {
  const discount = Number.isFinite(discountAmount) ? discountAmount : 0
  return roundMoney(Math.max(0, lineSubtotal - discount))
}

export function calcLineTotalWithAdjustments(
  quantity: number,
  unitCost: number,
  lineDiscount: number,
  lineTax: number,
): number {
  const lineSubtotal = calcLineSubtotal(quantity, unitCost)
  const discount = Number.isFinite(lineDiscount) ? lineDiscount : 0
  const tax = Number.isFinite(lineTax) ? lineTax : 0
  return roundMoney(lineSubtotal - discount + tax)
}

export function calcFormInvoiceTotals(
  lineTotals: number[],
  invoiceDiscount: number,
  invoiceTax: number,
): {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
} {
  const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0))
  const discountAmount = Number.isFinite(invoiceDiscount) ? invoiceDiscount : 0
  const taxAmount = Number.isFinite(invoiceTax) ? invoiceTax : 0
  const total = roundMoney(subtotal - discountAmount + taxAmount)

  return { subtotal, discountAmount, taxAmount, total }
}

export type DiscountSyncSource = 'percent' | 'amount'

export function calcPurchaseTotals(
  lines: Array<{ lineTotal: number }>,
  discountAmount: number,
  taxAmount: number,
): {
  subtotal: number
  total: number
} {
  const subtotal = lines.reduce((sum, line) => sum + (line.lineTotal || 0), 0)
  const discount = Number.isFinite(discountAmount) ? discountAmount : 0
  const tax = Number.isFinite(taxAmount) ? taxAmount : 0
  const total = roundMoney(subtotal - discount + tax)

  return { subtotal: roundMoney(subtotal), total }
}

export function calcInvoiceTotals(
  lineTotals: number[],
  discountAmount: number,
  discountPercent: number,
  discountLastChanged: DiscountSyncSource,
  taxAmount: number,
  taxPercent: number,
  taxLastChanged: DiscountSyncSource,
): {
  subtotal: number
  discountAmount: number
  discountPercent: number
  afterDiscount: number
  taxAmount: number
  taxPercent: number
  total: number
} {
  const subtotal = roundMoney(lineTotals.reduce((sum, value) => sum + value, 0))

  let resolvedDiscountAmount = Number.isFinite(discountAmount) ? discountAmount : 0
  let resolvedDiscountPercent = Number.isFinite(discountPercent) ? discountPercent : 0
  if (discountLastChanged === 'percent') {
    resolvedDiscountAmount = amountFromPercent(subtotal, resolvedDiscountPercent)
  } else {
    resolvedDiscountPercent = percentFromAmount(subtotal, resolvedDiscountAmount)
  }

  const afterDiscount = roundMoney(Math.max(0, subtotal - resolvedDiscountAmount))

  let resolvedTaxAmount = Number.isFinite(taxAmount) ? taxAmount : 0
  let resolvedTaxPercent = Number.isFinite(taxPercent) ? taxPercent : 0
  if (taxLastChanged === 'percent') {
    resolvedTaxAmount = amountFromPercent(afterDiscount, resolvedTaxPercent)
  } else {
    resolvedTaxPercent = percentFromAmount(afterDiscount, resolvedTaxAmount)
  }

  return {
    subtotal,
    discountAmount: resolvedDiscountAmount,
    discountPercent: resolvedDiscountPercent,
    afterDiscount,
    taxAmount: resolvedTaxAmount,
    taxPercent: resolvedTaxPercent,
    total: roundMoney(afterDiscount + resolvedTaxAmount),
  }
}

export function isPurchaseInvoiceEditable(status: PurchaseInvoiceStatus): boolean {
  return status === 'DRAFT'
}

export function getReturnableQuantity(
  originalQuantity: number,
  returnedQuantity?: number | null,
): number {
  const returned = Number.isFinite(returnedQuantity) ? (returnedQuantity as number) : 0
  return Math.max(0, originalQuantity - returned)
}
