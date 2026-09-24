import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Ban } from 'lucide-react'
import { DetailField, DetailsCard, FieldGrid } from '../../components/fields'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n/useTranslation'
import * as expenseService from '../../services/expenseService'
import type { ExpenseResponse } from '../../types/expense'
import { translateApiError } from '../../utils/errors'
import { useCanViewExpenses, useCanVoidExpense } from '../../utils/expenseAccess'
import { getExpenseCategoryDisplayName } from '../../utils/expenseDisplay'
import { formatDate, formatDateTime, formatMoney } from '../../utils/format'
import { ExpenseVoidModal } from './ExpenseVoidModal'

export function ExpenseDetailPage() {
  const { t, locale } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const canView = useCanViewExpenses()
  const canVoid = useCanVoidExpense()

  const [expense, setExpense] = useState<ExpenseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false)

  const loadExpense = useCallback(async () => {
    if (!id || !canView) return
    setLoading(true)
    setError('')
    try {
      const data = await expenseService.getExpenseById(id)
      setExpense(data)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setExpense(null)
    } finally {
      setLoading(false)
    }
  }, [id, canView, t])

  useEffect(() => {
    void loadExpense()
  }, [loadExpense])

  function handleVoidSuccess() {
    setIsVoidModalOpen(false)
    void loadExpense()
  }

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft

  if (!canView) {
    return (
      <div className="expenses-detail-page">
        <PageHeader title={t('expenses.title')} />
        <div className="page-error-banner">{t('common.accessDenied')}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="expenses-detail-page">
        <PageHeader title={t('expenses.title')} />
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="expenses-detail-page">
        <PageHeader
          title={t('expenses.title')}
          actions={
            <Button variant="secondary" onClick={() => navigate('/expenses')}>
              <BackIcon size={16} aria-hidden />
              {t('expenses.detail.back')}
            </Button>
          }
        />
        <div className="page-error-banner">{error || t('expenses.detail.notFound')}</div>
      </div>
    )
  }

  const isVoided = expense.status === 'VOIDED'
  const branchDisplay =
    expense.branchId == null ? t('expenses.branch.companyLevel') : expense.branchName || '—'

  return (
    <div className="expenses-detail-page">
      <PageHeader
        title={t('expenses.detail.title', { id: expense.id })}
        badge={
          <Badge variant={isVoided ? 'muted' : 'success'}>
            {t(`expenses.status.${expense.status}`)}
          </Badge>
        }
        actions={
          <div className="page-header__actions">
            <Button variant="secondary" onClick={() => navigate('/expenses')}>
              <BackIcon size={16} aria-hidden />
              {t('expenses.detail.back')}
            </Button>
            {!isVoided && canVoid ? (
              <Button
                variant="danger"
                onClick={() => setIsVoidModalOpen(true)}
              >
                <Ban size={16} aria-hidden />
                <span>{t('expenses.void.button')}</span>
              </Button>
            ) : null}
          </div>
        }
      />

      {isVoided ? (
        <div className="expenses-void-banner" role="alert">
          <AlertTriangle size={24} className="expenses-void-banner__icon" aria-hidden />
          <div style={{ flex: 1 }}>
            <div className="expenses-void-banner__title">{t('expenses.detail.voidInfo')}</div>
            <div style={{ marginBlockEnd: 'var(--space-xs)' }}>
              <strong>{t('expenses.void.reasonLabel')}:</strong> {expense.voidReason}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {t('expenses.detail.voidedAt')}: {formatDateTime(expense.voidedAt, locale)}
              {expense.voidedBy ? ` • ${t('expenses.detail.voidedBy')}: #${expense.voidedBy}` : ''}
            </div>
          </div>
        </div>
      ) : null}

      <DetailsCard title={t('expenses.detail.info')}>
        <div style={{ marginBlockEnd: 'var(--space-lg)' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {t('expenses.columns.amount')}
          </span>
          <div
            className={`expenses-detail-amount${
              isVoided ? ' expenses-detail-amount--voided' : ''
            }`}
          >
            {formatMoney(expense.amount)}
          </div>
        </div>

        <FieldGrid>
          <DetailField
            label={t('expenses.columns.category')}
            value={getExpenseCategoryDisplayName(expense, locale)}
          />
          <DetailField
            label={t('expenses.columns.date')}
            value={formatDate(expense.expenseDate, locale)}
          />
          <DetailField
            label={t('expenses.columns.branch')}
            value={branchDisplay}
          />
          <DetailField
            label={t('expenses.columns.paymentSource')}
            value={t(`expenses.paymentSource.${expense.paymentSource}`)}
          />
          <DetailField
            label={t('expenses.columns.payee')}
            value={expense.payeeName || '—'}
          />
          <DetailField
            label={t('expenses.columns.status')}
            value={
              <Badge variant={isVoided ? 'muted' : 'success'}>
                {t(`expenses.status.${expense.status}`)}
              </Badge>
            }
          />
          <DetailField
            label={t('expenses.columns.description')}
            value={expense.description || '—'}
            fullWidth
            className="expenses-comment-field"
          />
        </FieldGrid>
      </DetailsCard>

      <DetailsCard title={t('expenses.detail.audit')}>
        <FieldGrid>
          <DetailField
            label={t('expenses.detail.createdAt')}
            value={formatDateTime(expense.createdAt, locale)}
          />
          <DetailField
            label={t('expenses.detail.createdBy')}
            value={expense.createdBy ? `#${expense.createdBy}` : '—'}
          />
        </FieldGrid>
      </DetailsCard>

      {isVoidModalOpen ? (
        <ExpenseVoidModal
          expense={expense}
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          onSuccess={handleVoidSuccess}
        />
      ) : null}
    </div>
  )
}
