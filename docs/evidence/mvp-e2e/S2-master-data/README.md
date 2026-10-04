# S2 — Master data bootstrap

**Run date:** 2026-10-03 · **Operator:** Claude (finder role) · **Tenant:** `tagreba` (id 2)
**Database:** `restaurant_saas_mvp` @ Flyway v69

## L042 — Branch creation is unachievable unaided: the only actionable error text is never rendered (P0)

### Repro

```bash
curl -s -X POST http://localhost:2020/api/branches \
  -H "Authorization: Bearer $OWNER" -H 'Content-Type: application/json' \
  -d '{"nameEn":"Main Branch","nameAr":"الفرع الرئيسي","code":"MAIN","timezone":"Africa/Cairo","active":true}'
```

Response — `HTTP 400`:

```json
{
  "errorCode": "LEGACY_ERROR",
  "message": "Code must start with TAGREBA-BR-",
  "params": {},
  "status": 400,
  "path": "/api/branches"
}
```

Creating it with `"code":"TAGREBA-BR-01"` → `HTTP 201`, `branchId=1`. The rule itself is fine.

### Why the user can never discover that

Three facts compose into a dead end:

1. **The prefix exists only in `message`.** `TenantCodeService.java:64` —
   `throw new ApiException(HttpStatus.BAD_REQUEST, "Code must start with " + expectedPrefix)`.
2. **`message` is never shown to a user.** Per PROJECT.md → Frontend state, the server `message`
   is *"explicitly logs-only and never rendered"*; `src/utils/errors.ts` builds user text from
   `errorCode` + `params` alone.
3. **`params` is empty**, so even a bespoke translation could not interpolate the prefix.

What the user actually sees, from `i18n/locales/{en,ar}/errors.ts`:

| Locale | Rendered text |
|---|---|
| `en` | `errors.LEGACY_ERROR` → "An error occurred while performing the operation, please try again" |
| `ar` | `errors.LEGACY_ERROR` → "حدث خطأ أثناء تنفيذ العملية، يرجى المحاولة مرة أخرى" |

"Please try again" is advice that cannot succeed. Every retry fails identically until someone
reads the server log or the source.

### Why P0

Branch is the hard prerequisite for warehouse → device → shift → orders → consumption → reports.
A tenant admin who cannot create a branch cannot reach any part of the cash-to-stock core. This
fails the Phase 6 criterion that a user completes their work **unaided**, and it sits on the first
screen of customer onboarding.

### Blast radius — a class of defect, not one message

`GlobalExceptionHandler.java:34-39` maps any **raw** `ApiException` to `errorCode: LEGACY_ERROR`,
preserving status and message. Raw throw sites still present:

| Module | `new ApiException(` sites |
|---|---|
| `tenant` | 16 |
| `auth` | 2 |
| **total** | **18** |

Every one of those 18 renders as the same generic sentence.

### Documentation drift worth correcting

PROJECT.md:193-195 presents the exception migration as *"nearly finished"*, noting Auth has 1 file
and Tenant 3, and that **"all remaining calls are `ApiException` — no deprecated
`BusinessException(String)` call survives in those four areas."**

The file counts check out, but the framing inverts the risk: being on raw `ApiException` *is* the
defective state, because that is precisely what produces `LEGACY_ERROR`. The doc reads as though
these four areas are almost done when they are the only places still emitting untranslatable
errors.

## Confirmed working

- Tenant creation (`POST /api/admin/tenants`) → `201`, id 2, `Africa/Cairo` honoured.
- Owner bootstrap (`POST /api/admin/tenants/2/owner`) → `201`.
- Branch creation with a conforming code → `201`, bilingual names stored.
- `X-Tenant-Id` header is not trusted; tenant identity is taken from the signed JWT.
