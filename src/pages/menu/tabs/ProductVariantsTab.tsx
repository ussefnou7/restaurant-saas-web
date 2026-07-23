import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, Search, X } from 'lucide-react'
import { FormInput } from '../../../components/fields'
import { Button } from '../../../components/ui/Button'
import { LoadingRows } from '../../../components/ui/LoadingRows'
import { useNotify } from '../../../components/ui/NotificationContext'
import { useTranslation } from '../../../i18n/useTranslation'
import * as menuService from '../../../services/menuService'
import type { Product } from '../../../types/menu'
import { translateApiError } from '../../../utils/errors'
import { formatMenuPrice, parseNonNegativeNumber } from '../menuNumberUtils'
import { ProductRecipeTab } from './ProductRecipeTab'

interface ProductVariantsTabProps {
  parent: Product
  onChanged?: () => void
}

type VariantLinkDraft = {
  variantLabelAr: string
  variantLabel: string
}

type VariantEditDraft = VariantLinkDraft & {
  sellingPrice: string
}

const emptyLinkDraft: VariantLinkDraft = {
  variantLabelAr: '',
  variantLabel: '',
}

const emptyEditDraft: VariantEditDraft = {
  ...emptyLinkDraft,
  sellingPrice: '',
}

export function ProductVariantsTab({ parent, onChanged }: ProductVariantsTabProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const [variants, setVariants] = useState<Product[]>([])
  const [candidates, setCandidates] = useState<Product[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Product | null>(null)
  const [linkDraft, setLinkDraft] = useState(emptyLinkDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<VariantEditDraft>(emptyEditDraft)
  const [saving, setSaving] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setVariants(await menuService.getProductVariants(parent.id))
    } catch (err) {
      setError(translateApiError(err, t).message)
      setVariants([])
    } finally {
      setLoading(false)
    }
  }, [parent.id, t])

  const loadCandidates = useCallback(async () => {
    setCandidatesLoading(true)
    setError('')
    try {
      const products = await menuService.getProducts()
      setCandidates(
        products.filter(
          (product) =>
            product.id !== parent.id &&
            product.parentProductId == null &&
            !(product.parent || product.isParent),
        ),
      )
    } catch (err) {
      setError(translateApiError(err, t).message)
      setCandidates([])
    } finally {
      setCandidatesLoading(false)
    }
  }, [parent.id, t])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const priceSummary = useMemo(() => {
    const prices = variants
      .map((variant) => variant.sellingPrice)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
    if (prices.length === 0) return t('common.empty.dash')
    if (prices.length === 1) return formatMenuPrice(prices[0], locale)
    return `${formatMenuPrice(prices[0], locale)} – ${formatMenuPrice(prices.at(-1)!, locale)}`
  }, [locale, t, variants])

  const filteredCandidates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const linkedIds = new Set(variants.map((variant) => variant.id))
    return candidates.filter((candidate) => {
      if (linkedIds.has(candidate.id)) return false
      if (!normalized) return true
      return [candidate.name, candidate.description, candidate.descriptionAr]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalized))
    })
  }, [candidates, query, variants])

  function labelFor(variant: Product): string {
    return (
      (locale === 'ar'
        ? variant.variantLabelAr || variant.variantLabel
        : variant.variantLabel || variant.variantLabelAr) || variant.name
    )
  }

  function openPicker() {
    setPickerOpen(true)
    setSelectedCandidate(null)
    setLinkDraft(emptyLinkDraft)
    void loadCandidates()
  }

  function closePicker() {
    setPickerOpen(false)
    setSelectedCandidate(null)
    setLinkDraft(emptyLinkDraft)
    setQuery('')
  }

  async function linkVariant() {
    if (!selectedCandidate || !linkDraft.variantLabelAr.trim()) {
      setError(t('menu.variants.validationLabelRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await menuService.updateProduct(selectedCandidate.id, {
        name: selectedCandidate.name,
        description: selectedCandidate.description ?? null,
        descriptionAr: selectedCandidate.descriptionAr ?? null,
        sellingPrice: selectedCandidate.sellingPrice,
        menuCategoryId: selectedCandidate.menuCategoryId,
        parentProductId: parent.id,
        variantLabel: linkDraft.variantLabel.trim() || null,
        variantLabelAr: linkDraft.variantLabelAr.trim(),
        isMenu: false,
      })
      notify.success(t('menu.variants.linkSuccess'))
      closePicker()
      await load()
      onChanged?.()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  function startEdit(variant: Product) {
    setEditingId(variant.id)
    setEditDraft({
      variantLabelAr: variant.variantLabelAr ?? '',
      variantLabel: variant.variantLabel ?? '',
      sellingPrice: String(variant.sellingPrice),
    })
  }

  async function saveEdit(variant: Product) {
    const price = parseNonNegativeNumber(editDraft.sellingPrice)
    if (!editDraft.variantLabelAr.trim() || price === null) {
      setError(t('menu.variants.validationRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      await menuService.updateProduct(variant.id, {
        name: variant.name,
        description: variant.description ?? null,
        descriptionAr: variant.descriptionAr ?? null,
        sellingPrice: price,
        menuCategoryId: variant.menuCategoryId,
        parentProductId: parent.id,
        variantLabel: editDraft.variantLabel.trim() || null,
        variantLabelAr: editDraft.variantLabelAr.trim(),
        isMenu: false,
      })
      notify.success(t('menu.toast.updateSuccess'))
      setEditingId(null)
      await load()
      onChanged?.()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setSaving(false)
    }
  }

  async function unlinkVariant(variant: Product) {
    const confirmed = window.confirm(t('menu.variants.unlink.confirm'))
    if (!confirmed) return
    setUnlinkingId(variant.id)
    try {
      await menuService.updateProduct(variant.id, {
        name: variant.name,
        description: variant.description ?? null,
        descriptionAr: variant.descriptionAr ?? null,
        sellingPrice: variant.sellingPrice,
        menuCategoryId: variant.menuCategoryId,
        parentProductId: null,
        variantLabel: variant.variantLabel ?? null,
        variantLabelAr: variant.variantLabelAr ?? null,
        isMenu: variant.isMenu,
      })
      notify.success(t('menu.variants.unlinkSuccess'))
      await load()
      onChanged?.()
    } catch {
      // API errors are translated and toasted by the global axios interceptor.
    } finally {
      setUnlinkingId(null)
    }
  }

  function toggle(variantId: number) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  if (loading) return <LoadingRows columns={3} rows={3} />

  return (
    <section className="product-variants-tab">
      {error ? <div className="page-error-banner">{error}</div> : null}
      <div className="product-variants-tab__header">
        <div>
          <h3>{t('menu.editor.tabs.variants')}</h3>
          <p>{t('menu.variants.summaryWithPrice', { count: variants.length, price: priceSummary })}</p>
        </div>
        <Button variant="primary" size="sm" onClick={openPicker} disabled={saving}>
          <Plus size={16} aria-hidden="true" />
          {t('menu.variants.addButton')}
        </Button>
      </div>

      {pickerOpen ? (
        <div className="product-variants-tab__picker">
          <label className="product-variants-tab__search">
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('menu.variants.picker.placeholder')}
              disabled={saving}
            />
            <button type="button" onClick={closePicker} aria-label={t('common.close')} disabled={saving}>
              <X size={16} aria-hidden="true" />
            </button>
          </label>
          {candidatesLoading ? (
            <LoadingRows columns={2} rows={2} />
          ) : (
            <ul>
              {filteredCandidates.length === 0 ? (
                <li className="product-variants-tab__candidate-empty">
                  {t('menu.variants.picker.empty')}
                </li>
              ) : null}
              {filteredCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    className={selectedCandidate?.id === candidate.id ? 'is-selected' : ''}
                    onClick={() => setSelectedCandidate(candidate)}
                    disabled={saving}
                  >
                    <span className="product-variants-tab__candidate-copy">
                      <strong>{candidate.name}</strong>
                      <small>{candidate.description ?? candidate.descriptionAr ?? t('common.empty.dash')}</small>
                    </span>
                    <span dir="ltr">{formatMenuPrice(candidate.sellingPrice, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedCandidate ? (
            <div className="variant-row variant-row--draft">
              <FormInput
                value={linkDraft.variantLabelAr}
                onChange={(event) =>
                  setLinkDraft((current) => ({ ...current, variantLabelAr: event.target.value }))
                }
                placeholder={t('menu.variants.labelAr')}
                disabled={saving}
                required
              />
              <FormInput
                value={linkDraft.variantLabel}
                onChange={(event) =>
                  setLinkDraft((current) => ({ ...current, variantLabel: event.target.value }))
                }
                placeholder={t('menu.variants.labelEn')}
                disabled={saving}
              />
              <div className="variant-row__actions">
                <Button variant="primary" size="sm" onClick={() => void linkVariant()} disabled={saving}>
                  {saving ? t('branches.actions.saving') : t('menu.variants.picker.confirm')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedCandidate(null)} disabled={saving}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {variants.length === 0 ? (
        <p className="product-variants-tab__empty">{t('menu.variants.empty')}</p>
      ) : (
        <ul className="product-variants-tab__list">
          {variants.map((variant) => {
            const expanded = expandedIds.has(variant.id)
            const editing = editingId === variant.id
            return (
              <li key={variant.id} className={`variant-row${expanded ? ' variant-row--expanded' : ''}`}>
                <div className="variant-row__summary">
                  <button type="button" onClick={() => toggle(variant.id)} aria-expanded={expanded}>
                    {expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                  </button>
                  {editing ? (
                    <>
                      <FormInput
                        value={editDraft.variantLabelAr}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, variantLabelAr: event.target.value }))
                        }
                        disabled={saving}
                      />
                      <FormInput
                        value={editDraft.variantLabel}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, variantLabel: event.target.value }))
                        }
                        disabled={saving}
                      />
                      <FormInput
                        type="number"
                        ltr
                        min={0}
                        step="0.01"
                        value={editDraft.sellingPrice}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, sellingPrice: event.target.value }))
                        }
                        disabled={saving}
                      />
                    </>
                  ) : (
                    <>
                      <span className="variant-row__chip">{labelFor(variant)}</span>
                      <span className="variant-row__name">{variant.name}</span>
                      <span className="variant-row__price" dir="ltr">
                        {formatMenuPrice(variant.sellingPrice, locale)}
                      </span>
                    </>
                  )}
                  <div className="variant-row__actions">
                    {editing ? (
                      <>
                        <Button variant="primary" size="sm" onClick={() => void saveEdit(variant)} disabled={saving}>
                          {t('common.save')}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)} disabled={saving}>
                          {t('common.cancel')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(variant)} disabled={saving}>
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void unlinkVariant(variant)}
                          disabled={unlinkingId === variant.id}
                        >
                          <X size={16} aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {expanded ? (
                  <div className="variant-row__recipe">
                    <ProductRecipeTab product={variant} nested />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
