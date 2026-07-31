import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useNotify } from '../../components/ui/NotificationContext'
import { SearchInput } from '../../components/ui/SearchInput'
import { useLocalized } from '../../i18n/useLocalized'
import { useTranslation } from '../../i18n/useTranslation'
import * as permissionService from '../../services/permissionService'
import type { PermissionResponse } from '../../types/permission'
import type { UserResponse } from '../../types/user'
import { translateApiError } from '../../utils/errors'
import {
  comparePermissionsByLocalizedName,
  getPermissionDescriptionFields,
  getPermissionNameFields,
  getPermissionTypeLabel,
  permissionMatchesSearch,
} from '../../utils/permissionDisplay'
import { getPermissionModuleIcon } from '../../utils/permissionModuleIcon'
import { getPermissionModuleLabel } from '../../utils/permissionModuleLabel'

/** Modules shown in the header summary before the "show more" toggle. */
const SUMMARY_PREVIEW_MODULES = 2

interface UserPermissionsPanelProps {
  user: UserResponse
}

function PermissionRow({
  checked,
  displayName,
  displayDescription,
  typeLabel,
  typeCode,
  onToggle,
}: {
  checked: boolean
  displayName: string
  displayDescription: string
  typeLabel: string
  typeCode: string
  onToggle: () => void
}) {
  return (
    <label className={`perm-row${checked ? ' perm-row--on' : ''}`}>
      <input
        type="checkbox"
        className="perm-row__switch"
        checked={checked}
        onChange={onToggle}
        aria-label={displayName}
      />
      <span className="perm-row__body">
        <span className="perm-row__head">
          <span className="perm-row__name">{displayName}</span>
          {typeLabel ? (
            <span className={`perm-row__level perm-row__level--${typeCode.toLowerCase()}`}>
              {typeLabel}
            </span>
          ) : null}
        </span>
        {displayDescription ? (
          <span className="perm-row__description">{displayDescription}</span>
        ) : null}
      </span>
    </label>
  )
}

export function UserPermissionsPanel({ user }: UserPermissionsPanelProps) {
  const { t } = useTranslation()
  const { locale, localized } = useLocalized()
  const notify = useNotify()
  const [allPermissions, setAllPermissions] = useState<PermissionResponse[]>([])
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [savedSnapshot, setSavedSnapshot] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeModule, setActiveModule] = useState('')
  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const loadPermissions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [permissions, userPermissions] = await Promise.all([
        permissionService.getPermissions(),
        permissionService.getUserPermissions(user.id),
      ])

      const availableCodes = new Set(permissions.map((permission) => permission.code))
      const selected = new Set(
        userPermissions.permissions
          .filter((permission) => permission.selected && availableCodes.has(permission.code))
          .map((permission) => permission.code),
      )

      setAllPermissions(permissions)
      setSelectedCodes(selected)
      setSavedSnapshot(new Set(selected))
    } catch (err) {
      setAllPermissions([])
      setSelectedCodes(new Set())
      setSavedSnapshot(new Set())
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t, user.id])

  useEffect(() => {
    setSearch('')
    setSummaryExpanded(false)
    void loadPermissions()
  }, [loadPermissions, user.id])

  const permissionsByModule = useMemo(() => {
    const groups = new Map<string, PermissionResponse[]>()
    for (const permission of allPermissions) {
      const existing = groups.get(permission.module) ?? []
      existing.push(permission)
      groups.set(permission.module, existing)
    }
    for (const [, list] of groups) {
      list.sort((a, b) => comparePermissionsByLocalizedName(a, b, locale))
    }
    return groups
  }, [allPermissions, locale])

  const moduleOptions = useMemo(() => {
    return [...permissionsByModule.keys()].sort((a, b) =>
      getPermissionModuleLabel(a, t).localeCompare(getPermissionModuleLabel(b, t)),
    )
  }, [permissionsByModule, t])

  /** Falls back to the first module until one is picked, or after the list reloads. */
  const currentModule = moduleOptions.includes(activeModule)
    ? activeModule
    : (moduleOptions[0] ?? '')

  const getModuleSelectionState = useCallback(
    (module: string) => {
      const modulePermissions = permissionsByModule.get(module) ?? []
      const selectedCount = modulePermissions.filter((permission) =>
        selectedCodes.has(permission.code),
      ).length

      return {
        total: modulePermissions.length,
        selectedCount,
        allSelected: selectedCount > 0 && selectedCount === modulePermissions.length,
      }
    },
    [permissionsByModule, selectedCodes],
  )

  /** Selected permissions grouped by module, ordered by how much of the module is on. */
  const summaryGroups = useMemo(() => {
    return moduleOptions
      .map((module) => {
        const permissions = (permissionsByModule.get(module) ?? []).filter((permission) =>
          selectedCodes.has(permission.code),
        )
        return { module, permissions, total: (permissionsByModule.get(module) ?? []).length }
      })
      .filter((group) => group.permissions.length > 0)
      .sort((a, b) => b.permissions.length - a.permissions.length)
  }, [moduleOptions, permissionsByModule, selectedCodes])

  const visibleSummaryGroups = summaryExpanded
    ? summaryGroups
    : summaryGroups.slice(0, SUMMARY_PREVIEW_MODULES)
  const hiddenSummaryGroups = summaryGroups.slice(visibleSummaryGroups.length)
  const hiddenSummaryCount = hiddenSummaryGroups.reduce(
    (sum, group) => sum + group.permissions.length,
    0,
  )

  const trimmedSearch = search.trim()

  /** Detail pane: search results across every module, or just the active module. */
  const detailGroups = useMemo(() => {
    if (trimmedSearch) {
      return moduleOptions
        .map((module) => ({
          module,
          permissions: (permissionsByModule.get(module) ?? []).filter((permission) =>
            permissionMatchesSearch(permission, trimmedSearch),
          ),
        }))
        .filter((group) => group.permissions.length > 0)
    }

    if (!currentModule) return []
    return [{ module: currentModule, permissions: permissionsByModule.get(currentModule) ?? [] }]
  }, [trimmedSearch, moduleOptions, permissionsByModule, currentModule])

  function togglePermission(code: string) {
    setSelectedCodes((current) => {
      const next = new Set(current)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  function toggleModuleSelection(module: string) {
    const moduleCodes = (permissionsByModule.get(module) ?? []).map((permission) => permission.code)
    const allSelected = moduleCodes.every((code) => selectedCodes.has(code))

    setSelectedCodes((current) => {
      const next = new Set(current)
      for (const code of moduleCodes) {
        if (allSelected) {
          next.delete(code)
        } else {
          next.add(code)
        }
      }
      return next
    })
  }

  function handleReset() {
    setSelectedCodes(new Set(savedSnapshot))
  }

  const hasChanges = useMemo(() => {
    if (selectedCodes.size !== savedSnapshot.size) return true
    for (const code of selectedCodes) {
      if (!savedSnapshot.has(code)) return true
    }
    return false
  }, [selectedCodes, savedSnapshot])

  async function handleSave() {
    setSaving(true)

    try {
      await permissionService.replaceUserPermissions(user.id, [...selectedCodes])
      setSavedSnapshot(new Set(selectedCodes))
      notify.success(t('permissions.manage.saved'))
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  const totalCount = allPermissions.length
  const selectedCount = selectedCodes.size
  const progress = totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0

  function renderChip(permission: PermissionResponse) {
    const displayName = localized(getPermissionNameFields(permission))

    return (
      <li key={permission.code}>
        <span className="perm-chip">
          <span className="perm-chip__name">{displayName}</span>
          <button
            type="button"
            className="perm-chip__remove"
            onClick={() => togglePermission(permission.code)}
            aria-label={`${t('common.actions.remove')} ${displayName}`}
          >
            <X size={13} aria-hidden />
          </button>
        </span>
      </li>
    )
  }

  return (
    <div className="user-permissions">
      {loading ? (
        <p className="loading-state user-permissions__loading">{t('permissions.manage.loading')}</p>
      ) : null}

      {!loading && error ? (
        <div className="user-permissions__state">
          <div className="alert-error">{error}</div>
          <Button variant="secondary" onClick={() => void loadPermissions()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          <section className="perm-summary" aria-label={t('userDetails.permissions.selectedTitle')}>
            <div className="perm-summary__meter">
              <span className="perm-summary__count">
                {t('userDetails.permissions.enabledCount', { count: selectedCount })}
              </span>
              <span className="perm-summary__scope">
                {t('userDetails.permissions.enabledScope', {
                  total: totalCount,
                  modules: summaryGroups.length,
                })}
              </span>
              <span
                className="perm-summary__bar"
                role="progressbar"
                aria-valuenow={selectedCount}
                aria-valuemin={0}
                aria-valuemax={totalCount}
              >
                <span className="perm-summary__bar-fill" style={{ inlineSize: `${progress}%` }} />
              </span>
              <button
                type="button"
                className="perm-summary__clear"
                onClick={() => setSelectedCodes(new Set())}
                disabled={selectedCount === 0}
              >
                {t('userDetails.permissions.clearAll')}
              </button>
            </div>

            {summaryGroups.length === 0 ? (
              <p className="perm-summary__empty">{t('userDetails.permissions.noneSelected')}</p>
            ) : (
              <ul className="perm-summary__groups">
                {visibleSummaryGroups.map(({ module, permissions, total }) => (
                  <li key={module} className="perm-summary__group">
                    <button
                      type="button"
                      className="perm-summary__group-label"
                      onClick={() => {
                        setSearch('')
                        setActiveModule(module)
                      }}
                    >
                      <span>{getPermissionModuleLabel(module, t)}</span>
                      <span className="perm-summary__group-count">
                        {t('permissions.modules.count', {
                          selected: permissions.length,
                          total,
                        })}
                      </span>
                    </button>
                    <ul className="perm-summary__chips">{permissions.map(renderChip)}</ul>
                  </li>
                ))}
              </ul>
            )}

            {hiddenSummaryCount > 0 || summaryExpanded ? (
              <button
                type="button"
                className="perm-summary__more"
                onClick={() => setSummaryExpanded((current) => !current)}
              >
                {summaryExpanded
                  ? t('userDetails.permissions.showLess')
                  : t('userDetails.permissions.showMore', {
                      count: hiddenSummaryCount,
                      modules: hiddenSummaryGroups.length,
                    })}
                <ChevronDown
                  size={14}
                  aria-hidden
                  className={`perm-summary__more-icon${
                    summaryExpanded ? ' perm-summary__more-icon--open' : ''
                  }`}
                />
              </button>
            ) : null}
          </section>

          <div className="perm-workspace">
            <nav className="perm-modules" aria-label={t('userDetails.permissions.allTitle')}>
              {moduleOptions.map((module) => {
                const { total, selectedCount: moduleSelected } = getModuleSelectionState(module)
                const ModuleIcon = getPermissionModuleIcon(module)
                const isActive = !trimmedSearch && module === currentModule

                return (
                  <button
                    key={module}
                    type="button"
                    className={`perm-module-nav${isActive ? ' perm-module-nav--active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => {
                      setSearch('')
                      setActiveModule(module)
                    }}
                  >
                    <span
                      className={`perm-module-nav__icon${
                        moduleSelected > 0 ? ' perm-module-nav__icon--on' : ''
                      }`}
                    >
                      <ModuleIcon size={15} aria-hidden />
                    </span>
                    <span className="perm-module-nav__label">
                      {getPermissionModuleLabel(module, t)}
                    </span>
                    <span
                      className={`perm-module-nav__count${
                        moduleSelected > 0 ? ' perm-module-nav__count--on' : ''
                      }`}
                    >
                      {t('permissions.modules.count', { selected: moduleSelected, total })}
                    </span>
                  </button>
                )
              })}
            </nav>

            <div className="perm-detail">
              <div className="perm-detail__search">
                <SearchInput
                  placeholder={t('userDetails.permissions.searchPlaceholder')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label={t('common.search')}
                />
              </div>

              {detailGroups.length === 0 ? (
                <p className="user-permissions__empty">{t('permissions.manage.noResultsTitle')}</p>
              ) : (
                detailGroups.map(({ module, permissions }) => {
                  const { total, selectedCount: moduleSelected, allSelected } =
                    getModuleSelectionState(module)

                  return (
                    <section key={module} className="perm-group">
                      <header className="perm-group__head">
                        <h4 className="perm-group__title">
                          {getPermissionModuleLabel(module, t)}
                        </h4>
                        <span className="perm-group__hint">
                          {t('permissions.modules.count', { selected: moduleSelected, total })}
                        </span>
                        {trimmedSearch ? null : (
                          <button
                            type="button"
                            className="perm-group__select-all"
                            onClick={() => toggleModuleSelection(module)}
                          >
                            {allSelected
                              ? t('userDetails.permissions.deselectAll')
                              : t('common.actions.selectAll')}
                          </button>
                        )}
                      </header>
                      <ul className="perm-group__list">
                        {permissions.map((permission) => (
                          <li key={permission.id}>
                            <PermissionRow
                              checked={selectedCodes.has(permission.code)}
                              displayName={localized(getPermissionNameFields(permission))}
                              displayDescription={localized(
                                getPermissionDescriptionFields(permission),
                              )}
                              typeLabel={getPermissionTypeLabel(permission.type, t)}
                              typeCode={permission.type ?? ''}
                              onToggle={() => togglePermission(permission.code)}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })
              )}
            </div>
          </div>
        </>
      ) : null}

      <footer className="user-permissions__footer">
        <div className="user-permissions__footer-actions">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={saving || loading || Boolean(error) || !hasChanges}
          >
            {t('common.actions.clear')}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving || loading || Boolean(error)}
          >
            {saving ? t('common.loading') : t('common.actions.saveChanges')}
          </Button>
        </div>
      </footer>
    </div>
  )
}
