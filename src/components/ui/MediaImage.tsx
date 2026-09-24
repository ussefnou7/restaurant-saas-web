import { useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/useTranslation'
import { fetchMediaObjectUrl } from '../../services/mediaService'

interface MediaImageProps {
  /** A `variants[].url` from a MediaResponse, or null to render the empty state. */
  url: string | null | undefined
  alt?: string
  className?: string
  /** Rendered when there is no url, or when the fetch fails. */
  fallback?: React.ReactNode
}

/**
 * An `<img>` for a permission-gated media URL.
 *
 * Media reads carry an Authorization header, which `<img src>` cannot send — so the bytes are
 * fetched as a blob and rendered from an object URL. Everything that displays an attachment goes
 * through this component; a raw `<img src={variant.url}>` anywhere in the app is a 401 that
 * renders as a broken image.
 */
export function MediaImage({ url, alt, className = '', fallback = null }: MediaImageProps) {
  const { t } = useTranslation()
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!url) {
      setObjectUrl(null)
      setFailed(false)
      return
    }

    let active = true
    setFailed(false)
    fetchMediaObjectUrl(url)
      .then((resolved) => {
        if (active) setObjectUrl(resolved)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    // The object URL is owned by the service's cache, not by this effect — revoking it here would
    // break every other mounted component showing the same image.
    return () => {
      active = false
    }
  }, [url])

  if (!url || failed) {
    return <>{fallback}</>
  }
  if (!objectUrl) {
    return <span className={`media-image media-image--loading ${className}`.trim()} aria-busy="true" />
  }
  return (
    <img
      className={`media-image ${className}`.trim()}
      src={objectUrl}
      alt={alt ?? t('media.previewAlt')}
    />
  )
}
