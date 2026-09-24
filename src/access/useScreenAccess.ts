import { useMemo } from 'react'
import { canDoAction, canOpenScreen } from './screenAccess'
import type { ScreenId } from './screen-map'
import { useAuthSession } from './useAuthSession'

type ActionsOf<S extends ScreenId> = (typeof import('./screen-map').SCREEN_MAP)[S] extends {
  actions: infer A
}
  ? keyof A
  : never

export interface ScreenAccess<S extends ScreenId> {
  canOpen: boolean
  can: (action: ActionsOf<S>) => boolean
}

/**
 * Binds a `SCREEN_MAP` entry to the live session, so both the gate and its denied behaviour come
 * from one place and re-render when permissions change.
 *
 * <p>Prefer this over a bespoke `can…()` helper for new screens: the action name is checked against
 * the map, and the map's codes are checked against the backend's generated contract, so a gate
 * cannot be invented at the call site.
 */
export function useScreenAccess<S extends ScreenId>(screen: S): ScreenAccess<S> {
  const { user } = useAuthSession()
  return useMemo(
    () => ({
      canOpen: canOpenScreen(user, screen),
      can: (action: ActionsOf<S>) => canDoAction(user, screen, action),
    }),
    [user, screen],
  )
}
