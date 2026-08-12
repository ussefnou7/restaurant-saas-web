import { useState } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { ConfirmModal } from '../../ui/ConfirmModal'
import { IconActionButton } from '../../ui/RowActions'
import { useTranslation } from '../../../i18n/useTranslation'

interface DocumentHeaderEditButtonProps {
  isEditing: boolean
  isDirty?: boolean
  saving?: boolean
  disabled?: boolean
  onStartEdit: () => void
  onSave: () => void | Promise<void>
  onConfirmDiscard: () => void
}

export function DocumentHeaderEditButton({
  isEditing,
  isDirty = false,
  saving = false,
  disabled = false,
  onStartEdit,
  onSave,
  onConfirmDiscard,
}: DocumentHeaderEditButtonProps) {
  const { t, locale } = useTranslation()
  const [discardModalOpen, setDiscardModalOpen] = useState(false)

  function handleEditOrCancelClick() {
    if (!isEditing) {
      onStartEdit()
    } else {
      if (isDirty) {
        setDiscardModalOpen(true)
      } else {
        onConfirmDiscard()
      }
    }
  }

  return (
    <>
      {isEditing ? (
        <>
          <IconActionButton
            className="action-btn action-btn--icon action-btn--confirm"
            label={t('common.save')}
            onClick={() => void onSave()}
            disabled={saving || disabled}
          >
            {saving ? (
              <Loader2 size={20} className="pi-form-actions__submit-spinner" aria-hidden />
            ) : (
              <Check size={20} aria-hidden />
            )}
          </IconActionButton>
          <IconActionButton
            className="action-btn action-btn--icon action-btn--cancel"
            label={t('common.cancel')}
            onClick={handleEditOrCancelClick}
            disabled={saving || disabled}
          >
            <X size={20} aria-hidden />
          </IconActionButton>
        </>
      ) : (
        <IconActionButton
          className="action-btn action-btn--icon"
          label={t('common.edit')}
          onClick={handleEditOrCancelClick}
          disabled={saving || disabled}
        >
          <Pencil size={20} aria-hidden />
        </IconActionButton>
      )}

      <ConfirmModal
        open={discardModalOpen}
        title={locale === 'ar' ? 'تجاهل التغييرات غير محفوظة؟' : 'Discard unsaved changes?'}
        message={
          locale === 'ar'
            ? 'لديك تغييرات غير محفوظة في بيانات المستند. هل تريد تجاهل هذه التغييرات؟'
            : 'You have unsaved changes in the document header. Are you sure you want to discard them?'
        }
        confirmLabel={locale === 'ar' ? 'تجاهل التغييرات' : 'Discard Changes'}
        cancelLabel={locale === 'ar' ? 'متابعة التعديل' : 'Keep Editing'}
        confirmVariant="dangerConfirm"
        onClose={() => setDiscardModalOpen(false)}
        onConfirm={() => {
          setDiscardModalOpen(false)
          onConfirmDiscard()
        }}
      />
    </>
  )
}
