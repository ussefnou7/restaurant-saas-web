# Deferred backend gaps

## Purchase-invoice line discount and tax

Purchase-invoice line requests and responses do not support per-line discount or tax. The web
form therefore omits those fields and computes its line preview as quantity × unit cost. This is
a deferral, not a cancellation: restoring the controls requires request, persistence, response,
and total-calculation support in the backend first.

## Purchase-invoice display rounding

Purchase-invoice responses carry six-decimal line totals plus document `subtotal` and
`totalAmount`. The server sums stored line totals before the UI rounds each value to two decimal
places for presentation. Consequently, the sum of displayed line values is not guaranteed to
equal the displayed document total (for example, three raw lines of 90.625). The live database
had zero such invoices on 2026-08-22, but the calculation permits them. Choosing full-precision
line display or a total based on rounded lines is a product/accounting decision; current behavior
is intentionally unchanged.
