import { useCallback, useMemo } from 'react'
import { useUomLookup } from './useUomLookup'

/**
 * Props to spread onto any UOM picker element.
 *
 * Revalidate-on-open (D111): opening a picker fires one conditional request
 * against the lookup endpoint. The picker renders from the cache immediately and
 * never waits on the network — a `304` changes nothing, a `200` replaces the
 * cache and the open dropdown updates.
 *
 * This is the mechanism that guarantees a unit created by another user is
 * selectable without a reload. Resolve-on-miss cannot cover it: a user cannot
 * pick a unit that is not in the list.
 *
 * Both handlers are needed. `focus` covers keyboard navigation; `mousedown`
 * fires before the native dropdown paints, so a click that opens the list
 * without focusing first is still covered.
 */
export function useUomPickerProps(): {
  /** Spread onto a native <select> / FormSelect. */
  selectProps: { onFocus: () => void; onMouseDown: () => void }
  /** Pass as onOpen to Dropdown / SelectFilter, which own their open state. */
  onOpen: () => void
} {
  const { revalidateOnOpen } = useUomLookup()

  const onOpen = useCallback(() => {
    void revalidateOnOpen()
  }, [revalidateOnOpen])

  return useMemo(
    () => ({ selectProps: { onFocus: onOpen, onMouseDown: onOpen }, onOpen }),
    [onOpen],
  )
}
