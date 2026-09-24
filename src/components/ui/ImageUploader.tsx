import { useCallback, useEffect, useRef, useState } from 'react'
import { ImagePlus, Maximize2, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'
import {
  deleteMedia,
  findVariantUrl,
  getMediaForOwner,
  releaseMediaObjectUrl,
  uploadMedia,
} from '../../services/mediaService'
import {
  MEDIA_ACCEPTED_TYPES,
  MEDIA_MAX_BYTES,
  type MediaOwnerType,
  type MediaPurpose,
  type MediaResponse,
  type MediaVariantType,
} from '../../types/media'
import { Button } from './Button'
import { ConfirmModal } from './ConfirmModal'
import { MediaImage } from './MediaImage'
import { Modal } from './Modal'

interface ImageUploaderProps {
  purpose: MediaPurpose
  ownerType: MediaOwnerType
  ownerId: number | string
  /** `avatar` squares the frame with object-fit; the server never crops. */
  shape?: 'avatar' | 'wide'
  /** Which rendition to display. The upload always produces the purpose's whole set. */
  previewVariant?: MediaVariantType
  labelKey?: 'media.image.label' | 'media.photo.label'
  /** If false, hides the text label above the uploader. */
  showLabel?: boolean
  /** False hides both actions and leaves a read-only preview. */
  canManage?: boolean
  onChange?: (media: MediaResponse | null) => void
}

const ACCEPTED = new Set(MEDIA_ACCEPTED_TYPES.split(','))

/**
 * The single-image attachment control for a record that owns at most one.
 *
 * Replacement is destructive and removal is permanent, so both say so before they happen rather
 * than after: there is no version history behind this control and nothing to undo into.
 */
export function ImageUploader({
  purpose,
  ownerType,
  ownerId,
  shape = 'wide',
  previewVariant = 'MEDIUM',
  labelKey = 'media.image.label',
  showLabel = true,
  canManage = true,
  onChange,
}: ImageUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [media, setMedia] = useState<MediaResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [viewingFullSize, setViewingFullSize] = useState(false)

  const maxBytes = MEDIA_MAX_BYTES[purpose]
  const maxMb = Math.round(maxBytes / (1024 * 1024))
  const previewUrl = findVariantUrl(media, previewVariant) ?? findVariantUrl(media, 'ORIGINAL')
  const originalUrl = findVariantUrl(media, 'ORIGINAL') ?? previewUrl

  const load = useCallback(async () => {
    const attachments = await getMediaForOwner(ownerType, ownerId)
    setMedia(attachments.find((item) => item.purpose === purpose) ?? null)
  }, [ownerType, ownerId, purpose])

  useEffect(() => {
    let active = true
    void getMediaForOwner(ownerType, ownerId)
      .then((attachments) => {
        if (active) setMedia(attachments.find((item) => item.purpose === purpose) ?? null)
      })
      .catch(() => {
        // The axios interceptor owns the toast. A record with no readable attachment still
        // renders its empty state rather than blocking the form it sits in.
        if (active) setMedia(null)
      })
    return () => {
      active = false
    }
  }, [ownerType, ownerId, purpose])

  const handleFile = async (file: File) => {
    setClientError(null)

    if (!ACCEPTED.has(file.type)) {
      setClientError(t('media.wrongTypeClient'))
      return
    }
    if (file.size > maxBytes) {
      setClientError(
        t('media.tooLargeClient', {
          sizeMb: (file.size / (1024 * 1024)).toFixed(1),
          maxMb,
        }),
      )
      return
    }

    const supersededUrl = previewUrl
    setBusy(true)
    try {
      const uploaded = await uploadMedia(purpose, ownerId, file)
      // The replaced file's bytes are gone server-side; holding its blob would show a stale
      // image to anything that mounts against the old url before a reload.
      releaseMediaObjectUrl(supersededUrl)
      setMedia(uploaded)
      onChange?.(uploaded)
    } catch {
      // Interceptor already surfaced the translated errorCode. Re-read so the control reflects
      // what the server actually holds rather than what the attempt hoped for.
      await load().catch(() => undefined)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!media) return
    const removedUrl = previewUrl
    setBusy(true)
    try {
      await deleteMedia(media.linkId)
      releaseMediaObjectUrl(removedUrl)
      setMedia(null)
      onChange?.(null)
      setConfirmingRemove(false)
    } catch {
      await load().catch(() => undefined)
      setConfirmingRemove(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`image-uploader image-uploader--${shape}`}>
      {showLabel && <span className="image-uploader__label">{t(labelKey)}</span>}

      <div className="image-uploader__frame">
        <MediaImage
          url={previewUrl}
          className="image-uploader__preview"
          fallback={
            <span
              className="image-uploader__empty"
              onClick={() => {
                if (canManage && !busy) inputRef.current?.click()
              }}
              role={canManage ? 'button' : undefined}
              tabIndex={canManage ? 0 : undefined}
            >
              <ImagePlus size={22} aria-hidden="true" />
              <span className="image-uploader__empty-title">{t('media.empty')}</span>
              <span className="image-uploader__empty-hint">{t('media.emptyHint', { maxMb })}</span>
            </span>
          }
        />
        {busy && <span className="image-uploader__busy">{t('media.uploading')}</span>}

        {media && (
          <div className="image-uploader__overlay">
            <button
              type="button"
              className="image-uploader__icon-btn"
              title={t('media.viewFull')}
              aria-label={t('media.viewFull')}
              onClick={(e) => {
                e.stopPropagation()
                setViewingFullSize(true)
              }}
            >
              <Maximize2 size={16} aria-hidden="true" />
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  className="image-uploader__icon-btn"
                  title={t('media.replace')}
                  aria-label={t('media.replace')}
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation()
                    inputRef.current?.click()
                  }}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="image-uploader__icon-btn image-uploader__icon-btn--danger"
                  title={t('media.remove')}
                  aria-label={t('media.remove')}
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmingRemove(true)
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!media && canManage && (
        <div className="image-uploader__actions image-uploader__actions--centered">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={14} aria-hidden="true" />
            {t('media.upload')}
          </Button>
        </div>
      )}

      {clientError && <p className="image-uploader__error">{clientError}</p>}

      <input
        ref={inputRef}
        className="image-uploader__input"
        type="file"
        accept={MEDIA_ACCEPTED_TYPES}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      <ConfirmModal
        open={confirmingRemove}
        title={t('media.removeConfirmTitle')}
        message={t('media.removeConfirmText')}
        confirmLabel={t('media.removeConfirmAction')}
        loading={busy}
        onConfirm={() => void handleRemove()}
        onClose={() => setConfirmingRemove(false)}
      />

      <Modal
        open={viewingFullSize}
        title={t('media.fullSizeTitle')}
        size="large"
        onClose={() => setViewingFullSize(false)}
      >
        <div className="image-uploader__fullsize-view">
          <MediaImage
            url={originalUrl}
            alt={t('media.previewAlt')}
            className="image-uploader__fullsize-img"
            fallback={<span className="image-uploader__empty">{t('media.loadFailed')}</span>}
          />
        </div>
      </Modal>
    </div>
  )
}
