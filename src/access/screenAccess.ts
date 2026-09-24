import type { AuthUser } from '../types/auth'
import { hasAnyPermission, hasPermission } from './can'
import { hasModuleAccess } from './moduleAccess'
import type { PermissionCode } from './permissions.generated'
import { SCREEN_MAP, type DeniedBehaviour, type ScreenEntry, type ScreenId } from './screen-map'

/** Resolves the `PermissionCode | PermissionCode[]` shape both entry kinds use. */
function allows(user: AuthUser | null, requires: PermissionCode | readonly PermissionCode[]): boolean {
  return typeof requires === 'string'
    ? hasPermission(user, requires)
    : hasAnyPermission(user, requires)
}

export function canOpenScreen(user: AuthUser | null, screen: ScreenId): boolean {
  const entry: ScreenEntry = SCREEN_MAP[screen]
  if (entry.moduleAccess) {
    return hasModuleAccess(user, entry.moduleAccess)
  }
  return allows(user, entry.requires)
}

type ActionsOf<S extends ScreenId> = (typeof SCREEN_MAP)[S] extends { actions: infer A } ? keyof A : never

export function canDoAction<S extends ScreenId>(
  user: AuthUser | null,
  screen: S,
  action: ActionsOf<S>,
): boolean {
  const actions = (SCREEN_MAP[screen] as { actions?: Record<string, { requires: PermissionCode | readonly PermissionCode[] }> }).actions
  const entry = actions?.[action as string]
  // An action missing from the map is a bug on one side or the other; deny rather than default open.
  if (!entry) return false
  return allows(user, entry.requires)
}

export function screenDeniedBehaviour(screen: ScreenId): DeniedBehaviour {
  return SCREEN_MAP[screen].onDenied
}

export function actionDeniedBehaviour<S extends ScreenId>(screen: S, action: ActionsOf<S>): DeniedBehaviour {
  const actions = (SCREEN_MAP[screen] as { actions?: Record<string, { onDenied: DeniedBehaviour }> }).actions
  return actions?.[action as string]?.onDenied ?? 'hide'
}
