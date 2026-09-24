import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { DetailsCard, FieldGrid, FormField, FormInput, FormTextarea } from '../../components/fields'
import { Button } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Dropdown'
import { useNotify } from '../../components/ui/NotificationContext'
import { PageHeader } from '../../components/ui/PageHeader'
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
import { useCanCreateExpense } from '../../utils/expenseAccess'
import { getExpenseCategoryDisplayName } from '../../utils/expenseDisplay'
import { todayLocalDate } from '../../utils/format'
import { ExpenseShiftPicker } from './ExpenseShiftPicker'

interface FormState {
  categoryId: string
  amount: string
  expenseDate: string
  branchSelection: string
  description: string
  payeeName: string
  paymentSource: ExpensePaymentSource | ''
  paidFromShiftId: number | null
}

export function ExpenseCreatePage() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const notify = useNotify()
  const canCreate = useCanCreateExpense()

  const [categories, setCategories] = useState<ExpenseCategoryResponse[]>([])
  const [branches, setBranches] = useState<BranchResponse[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [openDropdown, setOpenDropdown] = useState<'category' | 'branch' | 'paymentSource' | null>(null)

  const [form, setForm] = useState<FormState>({
    categoryId: '',
    amount: '',
    expenseDate: todayLocalDate(),
    branchSelection: '',
    description: '',
    payeeName: '',
    paymentSource: 'CASH_ON_HAND',
    paidFromShiftId: null,
  })

  useEffect(() => {
    if (!canCreate) return
    void Promise.all([
      expenseService.getExpenseCategories().then(setCategories).catch(() => setCategories([])),
      branchService.getBranches().then(setBranches).catch(() => setBranches([])),
    ])
  }, [canCreate])

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

  const handleShiftChange = useCallback((paidFromShiftId: number | null) => {
    setForm((previous) => ({ ...previous, paidFromShiftId }))
    setFieldErrors((previous) => ({ ...previous, paidFromShiftId: '' }))
  }, [])

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
        paidFromShiftId: form.paymentSource === 'CASH_DRAWER' && form.branchSelection
          ? form.paidFromShiftId : null,
      }

      await expenseService.createExpense(payload)
      notify.success(t('expenses.create.success'))
      navigate('/expenses')
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

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft

  if (!canCreate) {
    return (
      <div className="expenses-create-page">
        <PageHeader title={t('expenses.create.title')} />
        <div className="page-error-banner">{t('common.accessDenied')}</div>
      </div>
    )
  }

  return (
    <div className="expenses-create-page">
      <PageHeader
        title={t('expenses.create.title')}
        actions={
          <Button variant="secondary" onClick={() => navigate('/expenses')}>
            <BackIcon size={16} aria-hidden />
            {t('expenses.detail.back')}
          </Button>
        }
      />

      <DetailsCard title={t('expenses.create.title')}>
        <form onSubmit={handleSubmit} noValidate>
          {generalError ? <div className="page-error-banner">{generalError}</div> : null}

          <FieldGrid className="expense-form__fields">
            <FormField
              label={t('expenses.create.category')}
              required
              error={fieldErrors.categoryId}
              className={openDropdown === 'category' ? 'field-box--open' : ''}
            >
              <Dropdown
                value={form.categoryId}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, categoryId: val }))
                  setFieldErrors((prev) => ({ ...prev, categoryId: '' }))
                  setOpenDropdown(null)
                }}
                onOpen={() => setOpenDropdown('category')}
                onClose={() => setOpenDropdown((cur) => (cur === 'category' ? null : cur))}
                options={categoryOptions}
                ariaLabel={t('expenses.create.category')}
                disabled={submitting}
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
                  setForm((prev) => ({ ...prev, expenseDate: e.target.value, paidFromShiftId: null }))
                  setFieldErrors((prev) => ({ ...prev, expenseDate: '' }))
                }}
                disabled={submitting}
                required
              />
            </FormField>

            <FormField
              label={t('expenses.create.branch')}
              error={fieldErrors.branchId}
              className={openDropdown === 'branch' ? 'field-box--open' : ''}
            >
              <Dropdown
                value={form.branchSelection}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, branchSelection: val, paidFromShiftId: null }))
                  setFieldErrors((prev) => ({ ...prev, branchId: '' }))
                  setOpenDropdown(null)
                }}
                onOpen={() => setOpenDropdown('branch')}
                onClose={() => setOpenDropdown((cur) => (cur === 'branch' ? null : cur))}
                options={branchOptions}
                ariaLabel={t('expenses.create.branch')}
                disabled={submitting}
              />
            </FormField>

            <FormField
              label={t('expenses.create.paymentSource')}
              required
              error={fieldErrors.paymentSource}
              className={openDropdown === 'paymentSource' ? 'field-box--open' : ''}
            >
              <Dropdown
                value={form.paymentSource}
                onChange={(val) => {
                  setForm((prev) => ({
                    ...prev,
                    paymentSource: val as ExpensePaymentSource | '',
                    paidFromShiftId: null,
                  }))
                  setFieldErrors((prev) => ({ ...prev, paymentSource: '' }))
                  setOpenDropdown(null)
                }}
                onOpen={() => setOpenDropdown('paymentSource')}
                onClose={() => setOpenDropdown((cur) => (cur === 'paymentSource' ? null : cur))}
                options={paymentSourceOptions}
                ariaLabel={t('expenses.create.paymentSource')}
                disabled={submitting}
              />
            </FormField>

            {form.paymentSource === 'CASH_DRAWER' && (
              <ExpenseShiftPicker
                key={`${form.branchSelection}:${form.expenseDate}`}
                branchId={form.branchSelection ? Number(form.branchSelection) : null}
                expenseDate={form.expenseDate}
                value={form.paidFromShiftId}
                onChange={handleShiftChange}
                disabled={submitting}
                error={fieldErrors.paidFromShiftId}
              />
            )}

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

            <FormField
              label={t('expenses.create.description')}
              error={fieldErrors.description}
              fullWidth
              className="expenses-comment-field"
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
          </FieldGrid>

          <div className="expenses-form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/expenses')}
              disabled={submitting}
            >
              {t('expenses.create.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('expenses.create.submitting') : t('expenses.create.submit')}
            </Button>
          </div>
        </form>
      </DetailsCard>
    </div>
  )
}
