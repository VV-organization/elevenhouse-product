import { maskContact, type Channel } from './authFlow'

export type AuthChallenge = {
  challengeId: string
  channel: Channel
  maskedIdentifier: string
  expiresAt: string
  resendAvailableAt: string
}
export type AuthIdentity = { channel: Channel; identifier: string }
export const PREVIEW_CODE = '123456'

export class AuthApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code)
    this.name = 'AuthApiError'
  }
}

function previewDelay(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Request cancelled', 'AbortError')); return }
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('Request cancelled', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 200)
    signal.addEventListener('abort', abort, { once: true })
  })
}

/** In-memory preview only: never sends a message, creates an account or calls a server. */
export function createPreviewAuthApi() {
  const challenges = new Map<string, AuthChallenge & { identityKey: string }>()
  let sequence = 0
  return {
    async requestCode(identity: AuthIdentity, signal: AbortSignal): Promise<AuthChallenge> {
      await previewDelay(signal)
      signal.throwIfAborted()
      const now = Date.now()
      const identityKey = `${identity.channel}:${identity.identifier}`
      for (const [id, challenge] of challenges) {
        if (Date.parse(challenge.expiresAt) <= now) challenges.delete(id)
        else if (challenge.identityKey === identityKey) {
          if (Date.parse(challenge.resendAvailableAt) > now) throw new AuthApiError(429, 'RATE_LIMITED')
          challenges.delete(id)
        }
      }
      const challenge: AuthChallenge = {
        challengeId: `preview-${++sequence}`,
        channel: identity.channel,
        maskedIdentifier: identity.channel === 'email' ? maskContact('email', identity.identifier) : `••• ••• •${identity.identifier.slice(-2)}`,
        expiresAt: new Date(now + 300_000).toISOString(),
        resendAvailableAt: new Date(now + 30_000).toISOString(),
      }
      challenges.set(challenge.challengeId, { ...challenge, identityKey })
      return challenge
    },
    async verifyCode(input: { challengeId: string; code: string; displayName?: string }, signal: AbortSignal): Promise<void> {
      await previewDelay(signal)
      signal.throwIfAborted()
      const challenge = challenges.get(input.challengeId)
      if (!challenge || Date.parse(challenge.expiresAt) <= Date.now()) {
        challenges.delete(input.challengeId)
        throw new AuthApiError(410, 'CODE_EXPIRED')
      }
      if (input.code !== PREVIEW_CODE) throw new AuthApiError(401, 'INVALID_CODE')
      challenges.delete(input.challengeId)
    },
  }
}

export const authApi = createPreviewAuthApi()
