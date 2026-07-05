import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string
}

export function SearchInput({ className = '', ...props }: SearchInputProps) {
  return (
    <div className={`search-input${className ? ` ${className}` : ''}`}>
      <Search className="search-input__icon" size={16} strokeWidth={2} aria-hidden="true" />
      <input type="search" className="search-input__field" {...props} />
    </div>
  )
}
