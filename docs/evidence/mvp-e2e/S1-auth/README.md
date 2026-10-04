# S1 — Auth / tenant bootstrap

**Run date:** 2026-10-03 · **Operator:** Claude (finder role, MVP_HARDENING_PLAN Phase 2)

## Environment

| | Value |
|---|---|
| Database | `restaurant_saas_mvp` — created empty, built by Flyway |
| Flyway top version | **v69** (68 migrations applied, V48 unused per O66) |
| Backend | `localhost:2020`, started in 11.657s, no startup errors |
| Backend tree | `47f3090`-era working tree, **uncommitted** — Phase 0 freeze deliberately skipped on owner's instruction (review files pending deletion) |
| Bootstrap account | `nou7` / `secret123`, seeded by `V4__sysadmin_user_seed.sql` |
| Test tenant | id `2`, code `tagreba`, timezone `Africa/Cairo` |

> Citations below reference a working tree, not a commit. This is weaker than the plan's M4
> requires and is recorded here so no finding is mistaken for commit-pinned.

## Confirmed by design — not findings

- **SYS_ADMIN cannot log in through the tenant path.** Passing `tenantCode: "system"` for `nou7`
  returns `INVALID_CREDENTIALS`; omitting `tenantCode` succeeds. Deliberate:
  `AuthService.java:104-106` throws `invalidCredentials()` when the resolved role is `SYS_ADMIN`,
  keeping a system admin from being authenticated inside a tenant context. Not filed.
- **Usernames are case-insensitive.** `nou7`, `Nou7`, `NOU7` all return 200.

## Observation (not filed)

`V4__sysadmin_user_seed.sql:19` documents `Login username: Nou7 or nou7 | Password: secret123`
but does not say *omit* `tenantCode`. The seed creates a tenant with code `system` 15 lines
above, so the natural first attempt is to supply it — which fails with a bare
`INVALID_CREDENTIALS` carrying no hint. Cost three attempts to diagnose. Docs nit.

## L038 — No password policy anywhere (P0)

### Repro

```bash
# 1. sys-admin token
curl -s -X POST http://localhost:2020/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"nou7","password":"secret123"}'

# 2. create a tenant OWNER whose password is a single character
curl -s -X POST http://localhost:2020/api/admin/tenants/2/owner \
  -H "Authorization: Bearer $SA" -H 'Content-Type: application/json' \
  -d '{"fullName":"Weak Pass Test","username":"weaktest","password":"1","email":"weak@test.com"}'
# => HTTP 201, account created

# 3. the account authenticates
curl -s -X POST http://localhost:2020/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantCode":"tagreba","username":"weaktest","password":"1"}'
# => HTTP 200, roleCode OWNER, permissions: 99
```

### Why it matters

`OWNER` is the most privileged account in a tenant — `V3__role_permission_seed.sql:1-3` grants it
**every active permission** (`JOIN permissions p ON p.is_active = TRUE`, no code filter), which the
login response confirms as 99 permissions. This is the account created at customer onboarding.

### Scope — systemic, not one endpoint

All four password-carrying DTOs validate with `@NotBlank` alone. No `@Size`, no `@Pattern`:

| DTO | Line | Path |
|---|---|---|
| `CreateTenantOwnerRequest` | `:10` | sys-admin creates tenant owner |
| `CreateTenantUserRequest` | `:10` | sys-admin creates tenant user |
| `CreateUserRequest` | `:10` | tenant creates its own users |
| `LoginRequest` | `:9` | login |

## L039 — No login rate limiting or account lockout (P0)

### Repro

```bash
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code} " -X POST http://localhost:2020/api/auth/login \
    -H 'Content-Type: application/json' \
    -d "{\"tenantCode\":\"tagreba\",\"username\":\"weaktest\",\"password\":\"wrong$i\"}"
done
# => 401 x25 — no 429, no increasing delay, no lockout

# correct password immediately afterwards:
# => HTTP 200
```

### Why it matters

Independent of L038, but they compound: unlimited guesses against an account with no minimum
password length is a practical takeover path for the account that holds a tenant's entire cash
and stock history. Fixing either one alone leaves the other exploitable — a 6-character minimum
is still brute-forceable without throttling, and throttling still permits a password of `1`.
