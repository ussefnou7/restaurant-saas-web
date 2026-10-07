import type { ReactNode } from 'react'
import { Lock, MinusCircle } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import type { BlockStatus, DashboardBlock } from '../../types/dashboard'

interface DashboardSectionProps<T> {
  titleKey: string
  subtitleKey?: string
  block: DashboardBlock<T> | undefined
  /** Rendered only when the block is OK and its payload is non-empty. */
  children: (data: T) => ReactNode
  /** Decides whether an OK block is empty. Defaults to treating arrays' length as emptiness. */
  isEmpty?: (data: T) => boolean
  /** `flush` drops the card chrome, for sections nested inside a drawer that already has it. */
  variant?: 'card' | 'flush'
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0
}

/**
 * A dashboard section, with the three non-OK states rendered as three different sentences.
 *
 * This component exists to make one mistake impossible: rendering a withheld or uncomputable block
 * as an empty one. All three look the same on screen unless something says otherwise, and the
 * reading an owner takes from a blank section is the reassuring one — "nothing to see" rather than
 * "you are not allowed to know" or "there was nothing to calculate this from". Every section on
 * the page goes through here so that none of them can forget.
 */
export function DashboardSection<T>({
  titleKey,
  subtitleKey,
  block,
  children,
  isEmpty = defaultIsEmpty,
  variant = 'card',
}: DashboardSectionProps<T>) {
  const { t } = useTranslation()
  const status: BlockStatus = block?.status ?? 'INSUFFICIENT_DATA'

  return (
    <section className={`dashboard-section dashboard-section--${variant}`}>
      <header className="dashboard-section__header">
        <h2 className="dashboard-section__title">{t(titleKey)}</h2>
        {subtitleKey ? (
          <p className="dashboard-section__subtitle">{t(subtitleKey)}</p>
        ) : null}
      </header>

      {status === 'HIDDEN_NO_PERMISSION' ? (
        <div className="dashboard-section__notice dashboard-section__notice--hidden">
          {/* Lock, not an empty-state illustration: the distinction is the whole point. */}
          <Lock size={18} aria-hidden="true" />
          <div>
            <p className="dashboard-section__notice-title">{t('dashboard.block.hidden.title')}</p>
            <p className="dashboard-section__notice-body">{t('dashboard.block.hidden.body')}</p>
          </div>
        </div>
      ) : null}

      {status === 'INSUFFICIENT_DATA' ? (
        <div className="dashboard-section__notice">
          <MinusCircle size={18} aria-hidden="true" />
          <div>
            <p className="dashboard-section__notice-title">
              {t('dashboard.block.insufficient.title')}
            </p>
            <p className="dashboard-section__notice-body">
              {t('dashboard.block.insufficient.body')}
            </p>
          </div>
        </div>
      ) : null}

      {status === 'OK' && block?.data !== null && block?.data !== undefined ? (
        isEmpty(block.data) ? (
          <p className="dashboard-section__empty">{t('dashboard.block.empty')}</p>
        ) : (
          children(block.data)
        )
      ) : null}
    </section>
  )
}
