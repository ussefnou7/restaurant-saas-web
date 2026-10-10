import type { ImgHTMLAttributes } from 'react'
import logoFull from '../../assets/bord-logo.svg'
import logoIcon from '../../assets/bord-icon.svg'
import '../../styles/logo.css'

export type LogoVariant = 'horizontal' | 'mark' | 'stacked'
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | number

export interface LogoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'size'> {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
  ariaLabel?: string
}

function resolveHeight(size: LogoSize): number {
  if (typeof size === 'number') return size
  switch (size) {
    case 'sm':
      return 36
    case 'lg':
      return 48
    case 'xl':
      return 56
    case 'md':
    default:
      return 40
  }
}

export function Logo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  ariaLabel = 'Bord',
  alt,
  style,
  ...props
}: LogoProps) {
  const height = resolveHeight(size)
  const isMark = variant === 'mark'
  const src = isMark ? logoIcon : logoFull
  const sizeClass = typeof size === 'string' ? `restoro-logo--${size}` : ''

  return (
    <div
      className={`restoro-logo restoro-logo--${variant} ${sizeClass} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <img
        src={src}
        alt={alt ?? ariaLabel}
        height={height}
        style={{
          height: `${height}px`,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
        {...props}
      />
    </div>
  )
}
