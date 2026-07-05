import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
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
  permissionMatchesSearch,
} from '../../utils/permissionDisplay'
import { getPermissionModuleLabel } from '../../utils/permissionModuleLabel'

interface UserPermissionsPanelProps {
  user: UserResponse
}

function PermissionItem({
  checked,
  displayName,
  displayDescription,
  onToggle,
}: {
  checked: boolean
  displayName: string
  displayDescription: string
  onToggle: () => void
}) {
  return (
    <label className={`perm-item${checked ? ' perm-item--selected' : ''}`}>
      <input
        type="checkbox"
        className="perm-item__checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={displayName}
      />
      <span className="perm-item__body">
        <span className="perm-item__name">{displayName}</span>
        {displayDescription ? (
          <span className="perm-item__description">{displayDescription}</span>
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
  const moduleSelectAllRefs = useRef<Map<string, HTMLInputElement>>(new Map())

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
    void loadPermissions()
  }, [loadPermissions, user.id])

  const permissionsByCode = useMemo(() => {
    const map = new Map<string, PermissionResponse>()
    for (const permission of allPermissions) {
      map.set(permission.code, permission)
    }
    return map
  }, [allPermissions])

  const selectedPermissions = useMemo(() => {
    return [...selectedCodes]
      .map((code) => permissionsByCode.get(code))
      .filter((permission): permission is PermissionResponse => Boolean(permission))
      .sort((a, b) => comparePermissionsByLocalizedName(a, b, locale))
  }, [selectedCodes, permissionsByCode, locale])

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

  const filteredModules = useMemo(() => {
    return moduleOptions
      .map((module) => {
        const permissions = (permissionsByModule.get(module) ?? []).filter((permission) =>
          permissionMatchesSearch(permission, search),
        )
        return { module, permissions }
      })
      .filter((entry) => entry.permissions.length > 0)
  }, [moduleOptions, permissionsByModule, search])

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
    const modulePermissions = permissionsByModule.get(module) ?? []
    const moduleCodes = modulePermissions.map((permission) => permission.code)
    const allSelected = moduleCodes.every((code) => selectedCodes.has(code))

    setSelectedCodes((current) => {
      const next = new Set(current)
      if (allSelected) {
        for (const code of moduleCodes) {
          next.delete(code)
        }
      } else {
        for (const code of moduleCodes) {
          next.add(code)
        }
      }
      return next
    })
  }

  function getModuleSelectionState(module: string) {
    const modulePermissions = permissionsByModule.get(module) ?? []
    const selectedCount = modulePermissions.filter((permission) =>
      selectedCodes.has(permission.code),
    ).length

    return {
      total: modulePermissions.length,
      selectedCount,
      allSelected: selectedCount > 0 && selectedCount === modulePermissions.length,
    }
  }

  useEffect(() => {
    for (const module of moduleOptions) {
      const input = moduleSelectAllRefs.current.get(module)
      if (!input) continue

      const { allSelected, selectedCount, total } = getModuleSelectionState(module)
      const someSelected = selectedCount > 0 && selectedCount < total

      input.indeterminate = someSelected && !allSelected
    }
  }, [selectedCodes, moduleOptions, permissionsByModule])

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
          <section className="user-permissions__selected">
            <header className="user-permissions__section-head">
              <div>
                <h3 className="user-permissions__section-title">
                  {t('userDetails.permissions.selectedTitle')}
                </h3>
                <p className="user-permissions__section-subtitle">
                  {t('userDetails.permissions.selectedSubtitle', { count: selectedCodes.size })}
                </p>
              </div>
            </header>

            {selectedPermissions.length === 0 ? (
              <p className="user-permissions__empty">{t('userDetails.permissions.noneSelected')}</p>
            ) : (
              <ul className="user-permissions__selected-list">
                {selectedPermissions.map((permission) => {
                  const displayName = localized(getPermissionNameFields(permission))

                  return (
                    <li key={permission.code}>
                      <div className="perm-selected-chip">
                        <span className="perm-selected-chip__name">{displayName}</span>
                        <button
                          type="button"
                          className="perm-selected-chip__remove"
                          onClick={() => togglePermission(permission.code)}
                          aria-label={`${t('common.actions.remove')} ${displayName}`}
                        >
                          <X size={14} aria-hidden />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="user-permissions__all">
            <header className="user-permissions__section-head user-permissions__section-head--row">
              <h3 className="user-permissions__section-title">
                {t('userDetails.permissions.allTitle')}
              </h3>
              <div className="user-permissions__search">
                <SearchInput
                  placeholder={t('userDetails.permissions.searchPlaceholder')}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label={t('common.search')}
                />
              </div>
            </header>

            {filteredModules.length === 0 ? (
              <p className="user-permissions__empty">{t('permissions.manage.noResultsTitle')}</p>
            ) : (
              <div className="perm-modules-grid">
                {filteredModules.map(({ module, permissions }) => {
                  const { total, selectedCount, allSelected } = getModuleSelectionState(module)

                  return (
                    <article key={module} className="perm-module-card">
                      <header className="perm-module-card__head">
                        <div className="perm-module-card__title-wrap">
                          <h4 className="perm-module-card__title">
                            {getPermissionModuleLabel(module, t)}
                          </h4>
                          <span className="perm-module-card__count">
                            {t('permissions.modules.count', { selected: selectedCount, total })}
                          </span>
                        </div>
                        <label className="perm-module-card__select-all">
                          <input
                            ref={(element) => {
                              if (element) {
                                moduleSelectAllRefs.current.set(module, element)
                              } else {
                                moduleSelectAllRefs.current.delete(module)
                              }
                            }}
                            type="checkbox"
                            className="perm-item__checkbox"
                            checked={allSelected}
                            onChange={() => toggleModuleSelection(module)}
                          />
                          <span>{t('common.actions.selectAll')}</span>
                        </label>
                      </header>
                      <ul className="perm-module-card__list">
                        {permissions.map((permission) => (
                          <li key={permission.id}>
                            <PermissionItem
                              checked={selectedCodes.has(permission.code)}
                              displayName={localized(getPermissionNameFields(permission))}
                              displayDescription={localized(
                                getPermissionDescriptionFields(permission),
                              )}
                              onToggle={() => togglePermission(permission.code)}
                            />
                          </li>
                        ))}
                      </ul>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
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
