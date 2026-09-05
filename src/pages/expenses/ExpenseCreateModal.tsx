import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import { FieldGrid, FormField, FormInput, FormSelect, FormTextarea } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import * as branchService from '../../services/branchService'
import * as expenseService from '../../services/expenseService'
import type { BranchResponse } from '../../types/branch'
import type {
  CreateExpenseRequest,
  ExpenseCategoryResponse,
  ExpensePaymentSource,
} from '../../types/expense'
import { getLocalizedBranchName } from '../../utils/branchDisplay'
import { translateApiError } from '../../utils/errors'
import { canCreateExpense } from '../../utils/expenseAccess'
import { getExpenseCategoryDisplayName } from '../../utils/expenseDisplay'
import { todayLocalDate } from '../../utils/format'

interface ExpenseCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormState {
  categoryId: string
  amount: string
  expenseDate: string
  branchSelection: string // '' for company-level, or branchId string
  description: string
  payeeName: string
  paymentSource: ExpensePaymentSource | ''
}

export function ExpenseCreateModal({ isOpen, onClose, onSuccess }: ExpenseCreateModalProps) {
  const { t, locale } = useTranslation()
  const canCreate = canCreateExpense()

  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  const [form, setForm] = useState<FormState>({
    categoryId: '',
    amount: '',
    expenseDate: todayLocalDate(),
    branchSelection: '',
    description: '',
    payeeName: '',
    paymentSource: 'CASH_ON_HAND',
  })

  // Load categories and branches when modal opens
  useEffect(() => {
    if (!isOpen) return
    setForm({
      categoryId: '',
      amount: '',
      expenseDate: todayLocalDate(),
      branchSelection: '',
      description: '',
      payeeName: '',
      paymentSource: 'CASH_ON_HAND',
    })
    setFieldErrors({})
    setGeneralError('')

    void Promise.all([
      expenseService.getExpenseCategories().then(setCategories).catch(() => setCategories([])),
      branchService.getBranches().then(setBranches).catch(() => setBranches([])),
    ])
  }, [isOpen])

  // Filter to active categories only (D116) and sort by current locale
  const activeCategories = useMemo(() => {
    return categories
      .filter((c) => c.active)
      .sort((a, b) => {
        const nameA = getExpenseCategoryDisplayName(a, locale)
        const nameB = getExpenseCategoryDisplayName(b, locale)
        return nameA.localeCompare(nameB, locale)
      })
  }, [categories, locale])

  // Branch options with explicit company-level option
  const branchOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.create.branchCompanyLevel') },
      ...branches.map((b) => ({
        value: String(b.id),
        label: getLocalizedBranchName(b, locale),
      })),
    ]
  }, [branches, locale, t])

  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.create.categoryPlaceholder') },
      ...activeCategories.map((c) => ({
        value: String(c.id),
        label: getExpenseCategoryDisplayName(c, locale),
      })),
    ]
  }, [activeCategories, locale, t])

  const paymentSourceOptions = useMemo(() => {
    return [
      { value: '', label: t('expenses.create.paymentSourcePlaceholder') },
      { value: 'CASH_DRAWER', label: t('expenses.paymentSource.CASH_DRAWER') },
      { value: 'CASH_ON_HAND', label: t('expenses.paymentSource.CASH_ON_HAND') },
      { value: 'BANK', label: t('expenses.paymentSource.BANK') },
    ]
  }, [t])

  function validate(): boolean {
    const errors: Record<string, string> = {}
    if (!form.categoryId) {
      errors.categoryId = t('expenses.create.categoryPlaceholder')
    }
    const numAmount = Number(form.amount)
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = t('errors.EXPENSE_INVALID_AMOUNT', { amount: form.amount || '0' })
    }
    if (!form.expenseDate) {
      errors.expenseDate = t('expenses.create.date')
    }
    if (!form.paymentSource) {
      errors.paymentSource = t('expenses.create.paymentSourcePlaceholder')
    }
    if (form.description.length > 500) {
      errors.description = t('errors.VALIDATION_FAILED.field', { constraint: 'max 500' })
    }
    if (form.payeeName.length > 255) {
      errors.payeeName = t('errors.VALIDATION_FAILED.field', { constraint: 'max 255' })
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
      const payload: CreateExpenseRequest = {
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        branchId: form.branchSelection ? Number(form.branchSelection) : null,
        description: form.description.trim() || null,
        payeeName: form.payeeName.trim() || null,
        paymentSource: form.paymentSource as ExpensePaymentSource,
      }

      await expenseService.createExpense(payload)
      onSuccess()
    } catch (err) {
      // The interceptor toasts the error; translateApiError helps map inline field errors if any
      const translated = translateApiError(err, t)
      if (translated.fieldErrors) {
        setFieldErrors(translated.fieldErrors)
      }
      setGeneralError(translated.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !canCreate) return null

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('expenses.create.title')}
      size="medium"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('expenses.create.cancel')}
          </Button>
          <Button type="submit" form="expense-create-form" disabled={submitting}>
            {submitting ? t('expenses.create.submitting') : t('expenses.create.submit')}
          </Button>
        </>
      }
    >
      <form id="expense-create-form" onSubmit={handleSubmit} noValidate>
        {/* Boundary Notice - D115 requirement: persistent helper text */}
        <div className="expenses-boundary-notice" role="note">
          <Info size={18} className="expenses-boundary-notice__icon" aria-hidden="true" />
          <div>{t('expenses.boundaryNotice')}</div>
        </div>

        {generalError ? <div className="page-error-banner">{generalError}</div> : null}

        <FieldGrid>
          <FormField
            label={t('expenses.create.category')}
            required
            error={fieldErrors.categoryId}
          >
            <FormSelect
              value={form.categoryId}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, categoryId: '' }))
              }}
              options={categoryOptions}
              disabled={submitting}
              required
            />
          </FormField>

          <FormField
            label={t('expenses.create.amount')}
            required
            error={fieldErrors.amount}
          >
            <FormInput
              type="number"
              step="0.01"
              min="0.01"
              placeholder={t('expenses.create.amountPlaceholder')}
              value={form.amount}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, amount: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, amount: '' }))
              }}
              disabled={submitting}
              required
            />
          </FormField>

          <FormField
            label={t('expenses.create.date')}
            required
            error={fieldErrors.expenseDate}
          >
            <FormInput
              type="date"
              value={form.expenseDate}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, expenseDate: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, expenseDate: '' }))
              }}
              disabled={submitting}
              required
            />
          </FormField>

          <FormField
            label={t('expenses.create.branch')}
            error={fieldErrors.branchId}
          >
            <FormSelect
              value={form.branchSelection}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, branchSelection: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, branchId: '' }))
              }}
              options={branchOptions}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label={t('expenses.create.paymentSource')}
            required
            error={fieldErrors.paymentSource}
          >
            <FormSelect
              value={form.paymentSource}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  paymentSource: e.target.value as ExpensePaymentSource | '',
                }))
                setFieldErrors((prev) => ({ ...prev, paymentSource: '' }))
              }}
              options={paymentSourceOptions}
              disabled={submitting}
              required
            />
          </FormField>

          <FormField
            label={t('expenses.create.payee')}
            error={fieldErrors.payeeName}
          >
            <FormInput
              type="text"
              maxLength={255}
              placeholder={t('expenses.create.payeePlaceholder')}
              value={form.payeeName}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, payeeName: e.target.value }))
                setFieldErrors((prev) => ({ ...prev, payeeName: '' }))
              }}
              disabled={submitting}
            />
          </FormField>
        </FieldGrid>

        <FormField
          label={t('expenses.create.description')}
          error={fieldErrors.description}
        >
          <FormTextarea
            rows={3}
            maxLength={500}
            placeholder={t('expenses.create.descriptionPlaceholder')}
            value={form.description}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }))
              setFieldErrors((prev) => ({ ...prev, description: '' }))
            }}
            disabled={submitting}
          />
        </FormField>
      </form>
    </Modal>
  )
}
