import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'
import type { Product } from '../../types/menu'
import { formatMenuPrice } from './menuNumberUtils'

interface AddOnPickerModalProps {
  open: boolean
  product: Product
  candidates: Product[]
  linkedIds: Set<number>
  loading: boolean
  error: string
  savingId: number | null
  onClose: () => void
  onSelect: (candidate: Product) => void
}

export function AddOnPickerModal({
  open,
  product,
  candidates,
  linkedIds,
  loading,
  error,
  savingId,
  onClose,
  onSelect,
}: AddOnPickerModalProps) {
  const { t, locale } = useTranslation()
  const [search, setSearch] = useState('')

  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale)
    return candidates.filter((candidate) => {
      if (candidate.id === product.id || candidate.parentProductId != null || candidate.parent) {
        return false
      }
      if (!query) return true
      return [candidate.name, candidate.description, candidate.descriptionAr]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase(locale).includes(query))
    })
  }, [candidates, locale, product.id, search])

  return (
    <Modal
      open={open}
      size="medium"
      className="add-on-picker-modal"
      title={t('menu.addOns.pickerTitle')}
      subtitle={t('menu.addOns.pickerSubtitle', { name: product.name })}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose} disabled={savingId !== null}>
          {t('common.close')}
        </Button>
      }
    >
      <label className="add-on-picker__search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('menu.addOns.searchPlaceholder')}
          aria-label={t('menu.addOns.searchPlaceholder')}
          autoFocus
        />
      </label>

      {error ? <div className="page-error-banner">{error}</div> : null}

      {loading ? (
        <LoadingRows columns={2} rows={4} />
      ) : results.length === 0 ? (
        <p className="add-on-picker__empty">
          {search ? t('menu.addOns.noSearchResults') : t('menu.addOns.noCandidates')}
        </p>
      ) : (
        <ul className="add-on-picker__results">
          {results.map((candidate) => {
            const linked = linkedIds.has(candidate.id)
            const saving = savingId === candidate.id
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  className={`add-on-picker__result${linked ? ' add-on-picker__result--linked' : ''}`}
                  onClick={() => onSelect(candidate)}
                  disabled={linked || savingId !== null}
                >
                  <span
                    className={`add-on-picker__dot${
                      candidate.isMenu ? '' : ' add-on-picker__dot--hidden'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="add-on-picker__result-copy">
                    <strong>{candidate.name}</strong>
                    <small>
                      {candidate.isMenu
                        ? t('menu.addOns.menuProduct')
                        : t('menu.products.badge.addOnOnly')}
                    </small>
                  </span>
                  <span className="add-on-picker__price" dir="ltr">
                    {formatMenuPrice(candidate.sellingPrice, locale)}
                  </span>
                  {linked ? <Check size={17} aria-label={t('menu.addOns.alreadyLinked')} /> : null}
                  {saving ? <span className="add-on-picker__saving">{t('branches.actions.saving')}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
