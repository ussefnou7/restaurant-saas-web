import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { useNotify } from '../../../components/ui/NotificationContext'
import { useTranslation } from '../../../i18n/useTranslation'
import * as menuService from '../../../services/menuService'
import type { Product, ProductAddOn } from '../../../types/menu'
import { translateApiError } from '../../../utils/errors'
import { formatMenuPrice } from '../menuNumberUtils'

interface ProductAddOnsTabProps {
  product: Product
}

export function ProductAddOnsTab({ product }: ProductAddOnsTabProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const [addOns, setAddOns] = useState<ProductAddOn[]>([])
  const [candidates, setCandidates] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [links, products] = await Promise.all([
        menuService.getProductAddOns(product.id),
        menuService.getProducts(),
      ])
      setAddOns(links)
      setCandidates(products)
    } catch (err) {
      setError(translateApiError(err, t).message)
      setAddOns([])
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [product.id, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const linkedIds = useMemo(() => new Set(addOns.map((link) => link.addOnProductId)), [addOns])
  const filteredCandidates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return candidates.filter((candidate) => {
      if (candidate.id === product.id) return false
      if (candidate.parentProductId != null) return false
      if (linkedIds.has(candidate.id)) return false
      if (!normalized) return true
      return [candidate.name, candidate.description, candidate.descriptionAr]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalized))
    })
  }, [candidates, linkedIds, product.id, query])

  async function add(candidate: Product) {
    setSavingId(candidate.id)
    try {
      await menuService.createProductAddOn(product.id, { addOnProductId: candidate.id })
      notify.success(t('menu.addOns.addSuccess'))
      await load()
      setPickerOpen(false)
      setQuery('')
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSavingId(null)
    }
  }

  async function remove(link: ProductAddOn) {
    setRemovingId(link.addOnProductId)
    try {
      await menuService.deleteProductAddOn(product.id, link.addOnProductId)
      notify.success(t('menu.addOns.removeSuccess'))
      await load()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <LoadingRows columns={2} rows={3} />

  return (
    <section className="product-addons-tab">
      {error ? <div className="page-error-banner">{error}</div> : null}
      <div className="product-addons-tab__header">
        <div>
          <h3>{t('menu.editor.tabs.addons')}</h3>
          <p>{t('menu.addOns.hint')}</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setPickerOpen((current) => !current)}>
          <Plus size={16} aria-hidden="true" />
          {t('menu.addons.addButton')}
        </Button>
      </div>

      {pickerOpen ? (
        <div className="product-addons-tab__picker">
          <label className="product-addons-tab__search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('menu.addons.picker.placeholder')}
            />
            <button type="button" onClick={() => setPickerOpen(false)} aria-label={t('common.close')}>
              <X size={16} aria-hidden="true" />
            </button>
          </label>
          <ul>
            {filteredCandidates.length === 0 ? <li className="product-addons-tab__candidate-empty">{t('menu.addOns.noCandidates')}</li> : null}
            {filteredCandidates.map((candidate) => (
              <li key={candidate.id}>
                <button type="button" onClick={() => void add(candidate)} disabled={savingId === candidate.id}>
                  <span>{candidate.name}</span>
                  <span dir="ltr">{formatMenuPrice(candidate.sellingPrice, locale)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {addOns.length === 0 ? (
        <p className="product-addons-tab__empty">{t('menu.addons.empty')}</p>
      ) : (
        <ul className="product-addons-tab__list">
          {addOns.map((link) => (
            <li key={link.id} className="addon-row">
              <span>{link.addOnProductName ?? t('common.empty.dash')}</span>
              <span dir="ltr">
                {link.addOnSellingPrice != null ? formatMenuPrice(link.addOnSellingPrice, locale) : t('common.empty.dash')}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void remove(link)} disabled={removingId === link.addOnProductId}>
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
