import {Select} from '../components/Select'
import {Icon} from '../components/Icon'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import wordmark from '../assets/brand/eleven-house-stacked.svg'
import { translateAuth } from './authCopy'
import {useLocale} from '../i18n'
import { CODE_LENGTH, countries, maskContact, normalizePhone, secondsLeft, validateCode, validateDetails, type AuthMode, type Channel, type FieldErrors, type Step } from './authFlow'
import { createPreviewAuthApi, AuthApiError, type AuthChallenge, type AuthIdentity } from './authApi'

type Notice = { title: string; text: string; tone?: 'error' | 'info'; action?: 'login' | 'register' | 'help' }
type PendingIdentity = AuthIdentity & { displayName?: string }
const errorNotices = {
  offline: { title: 'Не удалось подключиться', text: 'Проверьте интернет и попробуйте ещё раз. Введённые данные сохранены в форме.' },
  generic: { title: 'Не удалось продолжить', text: 'Попробуйте ещё раз. Если проблема повторится, обратитесь в поддержку.' },
  invalidCode: { title: 'Код не подошёл', text: 'Проверьте цифры и попробуйте ещё раз.' },
  expiredCode: { title: 'Время действия кода истекло', text: 'Запросите новый код и продолжите с этого шага.' },
  rate: { title: 'Коды запрашиваются слишком часто', text: 'Подождите немного и попробуйте запросить код ещё раз.' },
  server: { title: 'Нам нужна небольшая пауза', text: 'Сервис временно недоступен. Попробуйте ещё раз через несколько минут.' },
  exists: { title: 'У вас уже есть кабинет', text: 'Перейдите ко входу — повторно создавать кабинет не нужно.', action: 'login' },
  missing: { title: 'Кабинет не найден', text: 'Проверьте контакт или создайте новый кабинет.', action: 'register' },
  suspended: { title: 'Доступ к кабинету ограничен', text: 'Откройте помощь, чтобы узнать, как восстановить доступ.', action: 'help' },
} satisfies Record<string, Notice>

export type AuthenticatedPreview = { name: string; mode: AuthMode; channel: Channel; identifier: string }
export type AuthPageProps = { onAuthenticated: (value: AuthenticatedPreview) => void }

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [authApi] = useState(createPreviewAuthApi)
  const {locale, setLocale} = useLocale()
  const t = (text: string) => translateAuth(text, locale)
  const [mode, setMode] = useState<AuthMode>(() => new URLSearchParams(window.location.search).get('mode') === 'login' ? 'login' : 'register')
  const [step, setStep] = useState<Step>('details')
  const [channel, setChannel] = useState<Channel>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('RU')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState<Notice | null>(null)
  const [busy, setBusy] = useState<'send' | 'verify' | 'resend' | null>(null)
  const [challenge, setChallenge] = useState<AuthChallenge | null>(null)
  const [pendingIdentity, setPendingIdentity] = useState<PendingIdentity | null>(null)
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [status, setStatus] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const pending = useRef<AbortController | null>(null)
  const request = useRef(0)
  const previousStep = useRef(step)
  const contact = channel === 'email' ? email : phone
  const selectedCountry = countries.find((item) => item.id === country) ?? countries[0]
  const recipient = channel === 'email' ? email.trim() : `${selectedCountry.prefix} ${normalizePhone(phone, country)}`
  const maskedRecipient = challenge?.maskedIdentifier ?? maskContact(channel, recipient)
  const resendIn = secondsLeft(resendAt, now)
  const expiresIn = secondsLeft(expiresAt, now)
  const expired = step === 'code' && expiresAt > 0 && expiresIn === 0
  const isRegister = mode === 'register'

  useEffect(() => {
    const deadline = challenge ? Math.max(expiresAt, resendAt) : 0
    if (deadline <= Date.now()) return
    const interval = setInterval(() => {
      const time = Date.now()
      setNow(time)
      if (time >= deadline) clearInterval(interval)
    }, 500)
    return () => clearInterval(interval)
  }, [challenge, expiresAt, resendAt])

  useEffect(() => {
    if (previousStep.current !== step) {
      const codeInput = document.getElementById('auth-code') as HTMLInputElement | null
      const target = step === 'code' && codeInput && !codeInput.disabled ? codeInput : heading.current
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
      previousStep.current = step
    }
    document.title = `${t(step === 'code' ? 'Подтверждение' : step === 'help' ? 'Помощь со входом' : isRegister ? 'Создать кабинет' : 'Войти в кабинет')} — ElevenHouse`
  }, [step, isRegister, locale])

  useEffect(() => () => { request.current++; pending.current?.abort() }, [])

  function cancelPending() {
    request.current++
    pending.current?.abort()
    pending.current = null
    setBusy(null)
  }

  async function performRequest<T>(kind: 'send' | 'verify' | 'resend', action: (signal: AbortSignal) => Promise<T>, onSuccess: (result: T) => void) {
    if (pending.current) return
    const id = ++request.current
    const controller = new AbortController()
    pending.current = controller
    setBusy(kind)
    setNotice(null)
    setErrors((value) => ({ ...value, code: undefined }))
    setStatus(kind === 'verify' ? 'Проверяем код…' : 'Отправляем код…')
    try {
      const result = await action(controller.signal)
      if (id !== request.current) return
      setStatus('')
      onSuccess(result)
    } catch (error) {
      if (id !== request.current || (error instanceof DOMException && error.name === 'AbortError')) return
      handleRequestError(error, kind)
    } finally {
      if (id === request.current) {
        pending.current = null
        setBusy(null)
      }
    }
  }

  function handleRequestError(error: unknown, kind: 'send' | 'verify' | 'resend') {
    setStatus('')
    if (error instanceof AuthApiError && error.status === 0) {
      setNotice(errorNotices.offline)
      return
    }
    if (error instanceof AuthApiError) {
      if (error.code === 'CODE_EXPIRED') {
        setNow(Date.now())
        setExpiresAt(Date.now() - 1)
        setNotice(errorNotices.expiredCode)
        return
      }
      if (error.code === 'ACCOUNT_SUSPENDED' || error.status === 403) { setNotice(errorNotices.suspended); return }
      if (error.code === 'IDENTITY_EXISTS' || error.status === 409) { setNotice(errorNotices.exists); return }
      if (error.code === 'ACCOUNT_NOT_FOUND' || (kind === 'send' && mode === 'login' && error.status === 404)) { setNotice(errorNotices.missing); return }
      if (error.code === 'RATE_LIMITED' || error.status === 429) { setNotice(errorNotices.rate); return }
      if (kind === 'verify' && (error.code === 'INVALID_CODE' || error.status === 401)) {
        setErrors((value) => ({ ...value, code: 'Код не подошёл. Проверьте цифры.' }))
        focusError({ code: 'Код не подошёл. Проверьте цифры.' })
        return
      }
      if (error.status >= 500 || error.status === 502) { setNotice(errorNotices.server); return }
    }
    setNotice(errorNotices.generic)
  }

  function applyChallenge(nextChallenge: AuthChallenge) {
    const time = Date.now()
    setChallenge(nextChallenge)
    setNow(time)
    setExpiresAt(Date.parse(nextChallenge.expiresAt))
    setResendAt(Date.parse(nextChallenge.resendAvailableAt))
    setCode('')
    setErrors({})
    setNotice(null)
    setStep('code')
    setStatus(`Код отправлен ${channel === 'email' ? 'на почту' : 'на телефон'} ${nextChallenge.maskedIdentifier}.`)
  }

  function switchMode(next: AuthMode) {
    cancelPending()
    setMode(next); setStep('details'); setCode(''); setChallenge(null); setPendingIdentity(null); setErrors({}); setNotice(null); setStatus('')
  }

  function changeContact() {
    cancelPending(); setStep('details'); setChallenge(null); setPendingIdentity(null); setErrors({}); setNotice(null); setCode(''); setStatus('')
  }

  function focusError(nextErrors: FieldErrors) {
    const field = nextErrors.name ? 'auth-name' : nextErrors.contact ? 'auth-contact' : 'auth-code'
    requestAnimationFrame(() => document.getElementById(field)?.focus())
  }

  function sendCode(event?: FormEvent) {
    event?.preventDefault()
    if (busy || pending.current) return
    const nextErrors = validateDetails({ mode, channel, name, contact, country })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { focusError(nextErrors); return }
    const identifier = channel === 'email' ? contact.trim().toLowerCase() : `${selectedCountry.prefix}${normalizePhone(contact, country)}`
    const identity: AuthIdentity = { channel, identifier }
    setPendingIdentity({ ...identity, displayName: mode === 'register' ? name.trim() : undefined })
    void performRequest('send', (signal) => authApi.requestCode(identity, signal), applyChallenge)
  }

  function verify(event?: FormEvent, enteredCode = code) {
    event?.preventDefault()
    if (busy || pending.current || expired || !challenge || !pendingIdentity) return
    const error = validateCode(enteredCode)
    if (error) { setErrors({ code: error }); focusError({ code: error }); return }
    setCode(enteredCode)
    void performRequest('verify', (signal) => authApi.verifyCode({
      challengeId: challenge.challengeId,
      code: enteredCode,
      displayName: mode === 'register' ? pendingIdentity.displayName : undefined,
    }, signal), () => {
      onAuthenticated({ name: mode === 'register' ? pendingIdentity.displayName ?? '' : '', mode, channel: pendingIdentity.channel, identifier: pendingIdentity.identifier })
    })
  }

  function resend() {
    if (busy || resendIn > 0 || !pendingIdentity) return
    void performRequest('resend', (signal) => authApi.requestCode({ channel: pendingIdentity.channel, identifier: pendingIdentity.identifier }, signal), applyChallenge)
  }

  function openHelp() { cancelPending(); setStep('help'); setNotice(null); setStatus('') }

  function returnFromHelp() {
    setNow(Date.now())
    setStep(challenge && pendingIdentity ? 'code' : 'details')
    setNotice(null)
    setStatus('')
  }

  const title = step === 'code' ? 'Проверьте почту' : step === 'help' ? 'Поможем вернуться' : isRegister ? 'Создать кабинет' : 'Войти в кабинет'
  const actualTitle = step === 'code' && channel === 'phone' ? 'Проверьте телефон' : title


  return <div className="eh-auth eh-auth--focused" data-screen={step} lang={locale}>
    <a className="eh-auth__skip" href="#auth-content">{t("Перейти к форме")}</a>
    <header className="eh-auth__header">
      <div className="eh-auth__brand"><img src={wordmark} width="1131" height="682" alt="ElevenHouse" /></div>
      <div className="eh-auth__header-actions">
        <div className="eh-auth__languages" role="group" aria-label={t('Язык интерфейса')}>
          <button type="button" lang="ru" aria-label="Русский" aria-pressed={locale === 'ru'} onClick={() => setLocale('ru')}>RU</button>
          <span aria-hidden="true">/</span>
          <button type="button" lang="en" aria-label="English" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
        </div>
      </div>
    </header>

    <main className="eh-auth__layout">
      <section id="auth-content" className="eh-auth__portal" aria-label={t("Вход и регистрация")}>
        <div className="eh-auth__card">
          {step === 'details' && <div className="eh-auth__modes" aria-label={t("Выберите действие")}>
            <button type="button" aria-pressed={isRegister} onClick={() => switchMode('register')}>{t("Регистрация")}</button>
            <button type="button" aria-pressed={!isRegister} onClick={() => switchMode('login')}>{t("Вход")}</button>
          </div>}
          {(step === 'code' || step === 'help') && <button type="button" className="eh-auth__back" onClick={step === 'help' ? returnFromHelp : changeContact}>{step === 'code' ? t('Изменить контакт') : challenge ? t('Вернуться к коду') : t('Вернуться ко входу')}</button>}

          <div className="eh-auth__screen" key={`${step}-${mode}`}>
            <h1 ref={heading} tabIndex={-1}>{t(actualTitle)}</h1>
            <p className="eh-auth__description">{step === 'details' ? isRegister ? t('Укажите имя и подтвердите почту или телефон.') : t('Войдите по коду — пароль не нужен.') : step === 'code' ? <>{t("Код из ")}{CODE_LENGTH} {t(" цифр отправлен ")}{channel === 'email' ? t('на почту') : t('на номер')}<br /><strong className="eh-auth__recipient">{maskedRecipient}</strong></> : t('Выберите доступный способ входа.')}</p>

            {notice && <div className={`eh-auth__notice ${notice.tone === 'info' ? 'eh-auth__notice--info' : ''}`} role={notice.tone === 'info' ? 'status' : 'alert'}><Icon name="info" size={18} /><div><strong>{t(notice.title)}</strong><p>{t(notice.text)}</p>{notice.action && <button type="button" onClick={() => notice.action === 'help' ? openHelp() : switchMode(notice.action === 'login' ? 'login' : 'register')}>{notice.action === 'login' ? t('Перейти ко входу') : notice.action === 'register' ? t('Создать кабинет') : t('Помощь со входом')} </button>}</div></div>}

            {step === 'details' && <form ref={form} onSubmit={sendCode} noValidate aria-busy={!!busy}>
              {isRegister && <div className="eh-auth__field"><label htmlFor="auth-name">{t("Как к вам обращаться")}</label><input id="auth-name" name="name" autoComplete="given-name" placeholder={t("Ваше имя")} value={name} maxLength={200} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-error' : undefined} disabled={!!busy} onChange={(event) => { setName(event.target.value); setErrors((value) => ({ ...value, name: undefined })) }} />{errors.name && <p id="auth-name-error" className="eh-auth__field-error" role="alert">{t(errors.name)}</p>}</div>}
              <div className="eh-auth__contact-head"><label htmlFor="auth-contact">{channel === 'email' ? t('Электронная почта') : t('Номер телефона')}</label><button type="button" disabled={!!busy} onClick={() => { setChannel(channel === 'email' ? 'phone' : 'email'); setErrors({}); setNotice(null) }}>{channel === 'email' ? t('По телефону') : t('По почте')} </button></div>
              <div className="eh-auth__field eh-auth__field--contact">
                <div className={`eh-auth__contact-input ${channel === 'phone' ? 'eh-auth__contact-input--phone' : ''}`} data-invalid={!!errors.contact}>
                  {channel === 'phone' && <div className="eh-auth__country"><span className="eh-auth__country-code">{selectedCountry.id} {selectedCountry.prefix}</span><Select displayValue={`${selectedCountry.id} ${selectedCountry.prefix}`} aria-label={t("Код страны")} value={country} disabled={!!busy} onChange={(event) => { setCountry(event.target.value); setErrors({}) }}>{countries.map((item) => <option key={item.id} value={item.id}>{t(item.name)} ({item.prefix})</option>)}</Select></div>}
                  <input key={channel} id="auth-contact" name={channel} type={channel === 'email' ? 'email' : 'tel'} inputMode={channel === 'email' ? 'email' : 'tel'} autoComplete={channel === 'email' ? 'email' : 'tel-national'} autoCapitalize="none" spellCheck={false} placeholder={channel === 'email' ? 'you@example.com' : '999 123-45-67'} value={contact} maxLength={channel === 'email' ? 254 : 22} disabled={!!busy} aria-invalid={!!errors.contact} aria-describedby={errors.contact ? 'auth-contact-error' : 'auth-contact-hint'} onChange={(event) => { channel === 'email' ? setEmail(event.target.value) : setPhone(event.target.value); setErrors((value) => ({ ...value, contact: undefined })); setNotice(null) }} />
                  {channel === 'email' && <Icon name="mail" size={19} />}
                </div>
                {errors.contact && <p id="auth-contact-error" className="eh-auth__field-error" role="alert">{t(errors.contact)}</p>}
                <p id="auth-contact-hint" className="eh-auth__hint">{t("Пришлём код ")}{channel === 'email' ? t('на почту') : t('в SMS')}{t(".")}</p>
              </div>
              <button type="submit" className="eh-auth__primary" disabled={!!busy}>{busy ? <><span className="eh-auth__spinner" />{t("Отправляем код")}</> : <>{t('Получить код')}</>}</button>
            </form>}

            {step === 'code' && <form onSubmit={verify} noValidate aria-busy={!!busy}>
              <div className="eh-auth__field"><label htmlFor="auth-code">{t("Код подтверждения")}</label><input id="auth-code" className="eh-auth__code" name="code" autoComplete="one-time-code" inputMode="numeric" type="text" placeholder="000 000" maxLength={9} value={code} disabled={!!busy || expired} aria-invalid={!!errors.code} aria-describedby={errors.code ? 'auth-code-error' : 'auth-code-hint'} onChange={(event) => { const next = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH); setCode(next); setErrors({}) }} />{errors.code && <p id="auth-code-error" className="eh-auth__field-error" role="alert">{t(errors.code)}</p>}<p id="auth-code-hint" className="eh-auth__hint">{expired ? t('Запросите новый код ниже.') : t(`Код действует ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`)}</p></div>
              {expired && <div className="eh-auth__notice" role="alert"><Icon name="info" size={18} /><div><strong>{t('Время действия кода истекло')}</strong><p>{t('Это бывает. Получите новый код и продолжите с этого шага.')}</p></div></div>}
              {!expired && <button className="eh-auth__primary" type="submit" disabled={!!busy}>{busy === 'verify' ? <><span className="eh-auth__spinner" />{t("Проверяем код")}</> : <>{t("Войти в кабинет")}</>}</button>}
              <div className={`eh-auth__resend ${expired ? 'eh-auth__resend--primary' : ''}`}><button type="button" onClick={resend} disabled={!!busy || resendIn > 0}>{busy === 'resend' ? t('Отправляем новый код…') : resendIn > 0 ? t(`Отправить повторно через ${resendIn} сек.`) : t('Отправить новый код')}</button></div>
              <button className="eh-auth__text-button eh-auth__delivery" type="button" onClick={() => setNotice({ title: 'Не получается найти код?', text: channel === 'email' ? 'Проверьте папку «Спам» и адрес выше. Письмо может идти несколько минут. Можно отправить новый код или изменить контакт.' : 'Проверьте номер и приём SMS. Сообщение может идти несколько минут. Можно отправить новый код или изменить контакт.', tone: 'info' })}>{t("Код не приходит?")}</button>
            </form>}

            {step === 'help' && <div className="eh-auth__help"><div><div><h2>{t("Есть другой контакт?")}</h2><p>{t("Войдите через почту или телефон, уже привязанные к вашему кабинету.")}</p><button className="eh-auth__text-button" type="button" onClick={() => { setChannel(channel === 'email' ? 'phone' : 'email'); switchMode('login') }}>{t("Выбрать другой способ ")}</button></div></div><div><div><h2>{t("Нет доступа к почте и телефону?")}</h2><p>{t("Восстановите доступ к почте у почтового провайдера или к номеру у оператора. Если это невозможно, обратитесь в поддержку ElevenHouse.")}</p></div></div><p className="eh-auth__help-note"><Icon name="lock" size={16} />{t("Никому не сообщайте код подтверждения, даже если собеседник представляется поддержкой.")}</p></div>}
          </div>
          {step !== 'help' && <div className="eh-auth__card-bottom"><span>{step === 'code' ? t('Не удаётся войти?') : isRegister ? t('Уже есть кабинет?') : t('Ещё нет кабинета?')}</span><button type="button" onClick={() => step === 'code' ? openHelp() : switchMode(isRegister ? 'login' : 'register')}>{step === 'code' ? t('Помощь') : isRegister ? t('Войти') : t('Создать')}</button></div>}
        </div>
      </section>
    </main>

    {step !== 'help' && <footer className="eh-auth__footer"><button type="button" onClick={openHelp}>{t("Помощь со входом ")}</button></footer>}
    <div className="eh-auth__live" role="status" aria-live="polite" aria-atomic="true">{t(status)}</div>

  </div>
}
