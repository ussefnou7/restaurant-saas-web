import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LoadingRows } from '../../components/ui/LoadingRows'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'
import * as menuService from '../../services/menuService'
import type { Product, ProductAddOn } from '../../types/menu'
import { translateApiError } from '../../utils/errors'
import { formatMenuPrice } from './menuNumberUtils'
import { AddOnPickerModal } from './AddOnPickerModal'

interface ProductAddOnsPanelProps {
  product: Product
}

export function ProductAddOnsPanel({ product }: ProductAddOnsPanelProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()

  const [addOns, setAddOns] = useState<ProductAddOn[]>([])
  const [candidates, setCandidates] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
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

  const linkedIds = useMemo(
    () => new Set(addOns.map((link) => link.addOnProductId)),
    [addOns],
  )

  async function handleAdd(candidate: Product) {
    if (candidate.id === product.id || linkedIds.has(candidate.id)) return
    setSavingId(candidate.id)
    try {
      await menuService.createProductAddOn(product.id, { addOnProductId: candidate.id })
      notify.success(t('menu.addOns.addSuccess'))
      await load()
      setPickerOpen(false)
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSavingId(null)
    }
  }

  async function handleRemove(link: ProductAddOn) {
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

  if (loading) {
    return <LoadingRows columns={2} rows={3} />
  }

  return (
    <div className="product-addons">
      {error ? <div className="page-error-banner">{error}</div> : null}

      <div className="product-addons__header">
        <div>
          <h3>{t('menu.editor.tab.addOns')}</h3>
          <p>{t('menu.addOns.hint')}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setPickerOpen(true)}
        >
          <Plus size={16} aria-hidden="true" />
          {t('menu.addOns.add')}
        </Button>
      </div>

      {addOns.length === 0 ? (
        <p className="product-addons__empty">{t('menu.addOns.empty')}</p>
      ) : (
        <ul className="product-addons__list">
          {addOns.map((link) => (
            <li key={link.id} className="product-addons__item">
              <span className="product-addons__item-name">
                {link.addOnProductName ?? t('common.empty.dash')}
              </span>
              <span className="product-addons__item-price" dir="ltr">
                {link.addOnSellingPrice != null
                  ? formatMenuPrice(link.addOnSellingPrice, locale)
                  : t('common.empty.dash')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRemove(link)}
                disabled={removingId === link.addOnProductId}
                aria-label={t('menu.addOns.remove')}
              >
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddOnPickerModal
        open={pickerOpen}
        product={product}
        candidates={candidates}
        linkedIds={linkedIds}
        loading={loading}
        error={error}
        savingId={savingId}
        onClose={() => setPickerOpen(false)}
        onSelect={(candidate) => void handleAdd(candidate)}
      />
    </div>
  )
}
