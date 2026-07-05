import { useTranslation } from '../../i18n/useTranslation'
import type { Locale } from '../../i18n/types'

const locales: Locale[] = ['en', 'ar']

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()

  return (
    <div className="language-switcher" role="group" aria-label={t('common.language.label')}>
      {locales.map((value) => (
        <button
          key={value}
          type="button"
          className={`language-switcher__btn${locale === value ? ' language-switcher__btn--active' : ''}`}
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
        >
          {t(value === 'en' ? 'common.language.en' : 'common.language.ar')}
        </button>
      ))}
    </div>
  )
}
