import { useEffect, useState, type FormEvent } from 'react'
import { FormField, FormInput } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import * as expenseService from '../../services/expenseService'
import type { ExpenseCategoryRequest, ExpenseCategoryResponse } from '../../types/expense'
import { translateApiError } from '../../utils/errors'

interface ExpenseCategoryFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  category?: ExpenseCategoryResponse | null
  onClose: () => void
  onSuccess: () => void
}

export function ExpenseCategoryFormModal({
  isOpen,
  mode,
  category,
  onClose,
  onSuccess,
}: ExpenseCategoryFormModalProps) {
  const { t } = useTranslation()
  const notify = useNotify()
  const isEdit = mode === 'edit'

  const [name, setName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setFieldErrors({})
    setGeneralError('')

    if (isEdit && category) {
      setName(category.name)
      setNameAr(category.nameAr ?? '')
    } else {
      setName('')
      setNameAr('')
    }
  }, [isOpen, isEdit, category])

  if (!isOpen) return null

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!name.trim()) {
      errors.name = t('errors.VALIDATION_FAILED.field', { constraint: 'required' })
    } else if (name.trim().length > 255) {
      errors.name = t('errors.VALIDATION_FAILED.field', { constraint: 'max 255' })
    }

    if (nameAr.trim().length > 255) {
      errors.nameAr = t('errors.VALIDATION_FAILED.field', { constraint: 'max 255' })
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setGeneralError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload: ExpenseCategoryRequest = {
        name: name.trim(),
        nameAr: nameAr.trim() || null,
      }

      if (isEdit && category) {
        await expenseService.updateExpenseCategory(category.id, payload)
        notify.success(t('expenses.categories.updateSuccess'))
      } else {
        await expenseService.createExpenseCategory(payload)
        notify.success(t('expenses.categories.createSuccess'))
      }
      onSuccess()
    } catch (err) {
      const translated = translateApiError(err, t)
      if (translated.fieldErrors) {
        setFieldErrors(translated.fieldErrors)
      }
      setGeneralError(translated.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEdit ? t('expenses.categories.edit') : t('expenses.categories.new')}
      size="default"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('expenses.create.cancel')}
          </Button>
          <Button type="submit" form="expense-category-form" disabled={submitting}>
            {submitting ? t('expenses.create.submitting') : t('expenses.create.submit')}
          </Button>
        </>
      }
    >
      <form id="expense-category-form" onSubmit={handleSubmit} noValidate>
        {generalError ? <div className="page-error-banner">{generalError}</div> : null}

        <FormField
          label={t('expenses.categories.nameEn')}
          required
          error={fieldErrors.name}
        >
          <FormInput
            type="text"
            maxLength={255}
            placeholder={t('expenses.categories.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setFieldErrors((prev) => ({ ...prev, name: '' }))
            }}
            disabled={submitting}
            required
            autoFocus
          />
        </FormField>

        <FormField
          label={t('expenses.categories.nameAr')}
          error={fieldErrors.nameAr}
        >
          <FormInput
            type="text"
            maxLength={255}
            placeholder={t('expenses.categories.nameArPlaceholder')}
            value={nameAr}
            onChange={(e) => {
              setNameAr(e.target.value)
              setFieldErrors((prev) => ({ ...prev, nameAr: '' }))
            }}
            disabled={submitting}
            dir="rtl"
          />
        </FormField>
      </form>
    </Modal>
  )
}
