import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  EntityDetailModulePanel,
  EntityDetailModules,
  EntityDetailScreen,
  EntityOverviewActions,
  useEntityDetailTab,
} from '../../components/entity-detail'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useTranslation } from '../../i18n/useTranslation'
import * as userService from '../../services/userService'
import type { UserResponse } from '../../types/user'
import { translateApiError } from '../../utils/errors'
import { UserOverviewPanel } from './UserOverviewPanel'
import { UserPermissionsPanel } from './UserPermissionsPanel'

const TAB_PERMISSIONS = 'permissions'

export function UserDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tabs = useMemo(
    () => [{ id: TAB_PERMISSIONS, label: t('userDetails.tabs.permissions'), alwaysExpanded: true }],
    [t],
  )

  const { activeTab, setTab } = useEntityDetailTab(tabs, TAB_PERMISSIONS)

  const loadUser = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError('')

    try {
      const found = await userService.getUser(userId)
      setUser(found)
    } catch (err) {
      setUser(null)
      setError(translateApiError(err, t).message)
    } finally {
      setLoading(false)
    }
  }, [t, userId])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  function handleStartEdit() {
    setIsEditing(true)
    setError('')
  }

  function handleCancelEdit() {
    setIsEditing(false)
  }

  function handleSaved(updated: UserResponse) {
    setUser(updated)
    setIsEditing(false)
    setError('')
  }

  async function handleToggleStatus() {
    if (!user || isEditing) return

    setStatusBusy(true)
    try {
      const updated = await userService.updateUserStatus(user.id, !user.active)
      setUser(updated)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setStatusBusy(false)
    }
  }

  async function confirmDelete() {
    if (!user) return

    setDeleting(true)
    try {
      await userService.deleteUser(user.id)
      navigate('/users')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const overviewActions =
    user && !isEditing ? (
      <EntityOverviewActions
        editLabel={t('userDetails.actions.editUser')}
        deleteLabel={t('userDetails.actions.deleteUser')}
        statusLabel={
          user.active
            ? t('userDetails.actions.deactivateUser')
            : t('userDetails.actions.activateUser')
        }
        active={user.active}
        statusBusy={statusBusy}
        onEdit={handleStartEdit}
        onDelete={() => setDeleteOpen(true)}
        onToggleStatus={() => void handleToggleStatus()}
      />
    ) : null

  return (
    <>
      <EntityDetailScreen
        backTo="/users"
        backLabel={t('users.details.backToList')}
        loading={loading}
        loadingMessage={t('users.loading')}
        notFound={!loading && !user}
        notFoundTitle={t('users.details.notFoundTitle')}
        notFoundMessage={error || t('users.details.notFound')}
        error={user ? error : undefined}
        overview={
          user ? (
            <UserOverviewPanel
              user={user}
              editing={isEditing}
              onCancel={handleCancelEdit}
              onSaved={handleSaved}
              toolbarActions={overviewActions}
            />
          ) : null
        }
        modules={
          user ? (
            <EntityDetailModules tabs={tabs} activeTab={activeTab} onTabChange={setTab}>
              <EntityDetailModulePanel
                id={TAB_PERMISSIONS}
                activeTab={activeTab}
                alwaysExpanded
              >
                <UserPermissionsPanel user={user} />
              </EntityDetailModulePanel>
            </EntityDetailModules>
          ) : null
        }
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('users.deleteConfirm.title')}
        message={t('users.deleteConfirm.message')}
        confirmLabel={t('users.deleteConfirm.confirm')}
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  )
}
