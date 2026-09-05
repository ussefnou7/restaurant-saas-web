interface ExpenseCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ExpenseCreateModal({ isOpen }: ExpenseCreateModalProps) {
  if (!isOpen) return null
  return null
}
