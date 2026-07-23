import { Boxes, GitBranch, Layers3, Puzzle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useTranslation } from '../../i18n/useTranslation'

export type ProductEditorRole = 'standard' | 'parent' | 'variant' | 'addOn'

interface ProductRolePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (role: ProductEditorRole) => void
}

export function ProductRolePickerModal({ open, onClose, onSelect }: ProductRolePickerModalProps) {
  const { t } = useTranslation()

  const roles = [
    {
      id: 'standard' as const,
      icon: Boxes,
      title: t('menu.roles.standard'),
      description: t('menu.roles.standardDescription'),
    },
    {
      id: 'parent' as const,
      icon: Layers3,
      title: t('menu.roles.parent'),
      description: t('menu.roles.parentDescription'),
    },
    {
      id: 'variant' as const,
      icon: GitBranch,
      title: t('menu.roles.variant'),
      description: t('menu.roles.variantDescription'),
    },
    {
      id: 'addOn' as const,
      icon: Puzzle,
      title: t('menu.roles.addOn'),
      description: t('menu.roles.addOnDescription'),
    },
  ]

  return (
    <Modal
      open={open}
      size="medium"
      className="product-role-picker-modal"
      title={t('menu.roles.title')}
      subtitle={t('menu.roles.subtitle')}
      onClose={onClose}
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      }
    >
      <div className="product-role-picker" role="list">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <button
              key={role.id}
              type="button"
              className={`product-role-picker__option product-role-picker__option--${role.id}`}
              onClick={() => onSelect(role.id)}
              role="listitem"
            >
              <span className="product-role-picker__icon" aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className="product-role-picker__copy">
                <strong>{role.title}</strong>
                <span>{role.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
