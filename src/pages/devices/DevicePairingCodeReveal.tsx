import { Copy, TriangleAlert } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { useNotify } from '../../components/ui/NotificationContext'
import { useTranslation } from '../../i18n/useTranslation'

interface DevicePairingCodeRevealProps {
  pairingCode: string
  expiresAt: string
}

export function DevicePairingCodeReveal({
  pairingCode,
  expiresAt,
}: DevicePairingCodeRevealProps) {
  const { t, locale } = useTranslation()
  const notify = useNotify()
  const codeInputRef = useRef<HTMLInputElement>(null)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(pairingCode)
      notify.success(t('devices.pairing.copied'))
    } catch {
      codeInputRef.current?.focus()
      codeInputRef.current?.select()
      notify.error(t('devices.pairing.copyFailed'))
    }
  }

  const formattedExpiry = new Date(expiresAt).toLocaleTimeString(
    locale === 'ar' ? 'ar-EG' : 'en-US',
    { hour: 'numeric', minute: '2-digit' },
  )

  return (
    <div className="device-create-modal__secret-reveal">
      <div className="device-create-modal__warning" role="alert">
        <TriangleAlert aria-hidden="true" />
        <p>{t('devices.pairing.warning', { time: formattedExpiry })}</p>
      </div>
      <div className="device-create-modal__secret-row">
        <input
          ref={codeInputRef}
          className="device-create-modal__secret-field"
          value={pairingCode}
          readOnly
          inputMode="numeric"
          dir="ltr"
          aria-label={t('devices.pairing.title')}
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button
          variant="secondary"
          className="device-create-modal__copy-btn"
          onClick={() => void copyCode()}
        >
          <Copy size={18} aria-hidden="true" />
          {t('devices.pairing.copy')}
        </Button>
      </div>
      <div className="device-create-modal__qr">
        <QRCodeSVG value={pairingCode} size={160} marginSize={2} />
        <div className="device-create-modal__qr-text">
          <p className="device-create-modal__qr-title">{t('devices.pairing.qrTitle')}</p>
          <p className="device-create-modal__qr-note">{t('devices.pairing.qrNote')}</p>
        </div>
      </div>
    </div>
  )
}
