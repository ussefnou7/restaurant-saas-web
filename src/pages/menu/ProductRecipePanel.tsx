import type { Product } from '../../types/menu'
import { InlineRecipeEditor } from './InlineRecipeEditor'

interface ProductRecipePanelProps {
  product: Product
}

export function ProductRecipePanel({ product }: ProductRecipePanelProps) {
  return <InlineRecipeEditor product={product} />
}
