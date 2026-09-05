import type { ExpenseResponse } from '../../types/expense'

interface ExpenseVoidModalProps {
  expense: ExpenseResponse | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ExpenseVoidModal({ isOpen }: ExpenseVoidModalProps) {
  if (!isOpen) return null
  return null
}
