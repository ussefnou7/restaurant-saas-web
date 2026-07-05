import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { EntityDetailTabItem } from './EntityDetailModules'

export function useEntityDetailTab(tabs: EntityDetailTabItem[], defaultTabId: string) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const param = searchParams.get('tab')
    if (param && tabs.some((tab) => tab.id === param)) {
      return param
    }
    return defaultTabId
  }, [defaultTabId, searchParams, tabs])

  const setTab = useCallback(
    (tabId: string) => {
      if (tabId === defaultTabId) {
        setSearchParams({})
        return
      }
      setSearchParams({ tab: tabId })
    },
    [defaultTabId, setSearchParams],
  )

  return { activeTab, setTab }
}
