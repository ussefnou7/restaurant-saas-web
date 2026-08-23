/**
 * Standalone so both `api` and `authService` can import it without closing an
 * import cycle (`authService` imports `api`).
 *
 * Two literals that must stay equal is not something to leave to discipline: if
 * they drift, the UOM lookup cache stops being dropped on session change and one
 * tenant's units are served to the next.
 */
export const AUTH_SESSION_CHANGED_EVENT = 'auth-session-changed'
