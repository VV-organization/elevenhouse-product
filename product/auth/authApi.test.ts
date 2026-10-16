import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPreviewAuthApi } from './authApi'

describe('local preview authentication', () => {
  const identity = { channel: 'email' as const, identifier: 'anna@example.com' }
  const signal = () => new AbortController().signal
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-15T10:00:00Z')) })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(250)
    return promise
  }
  it('creates a masked five-minute challenge and verifies the demo code without network', async () => {
    const network = vi.fn(() => { throw new Error('Network must not be used') })
    vi.stubGlobal('fetch', network)
    const api = createPreviewAuthApi()
    const challenge = await settle(api.requestCode(identity, signal()))
    expect(challenge.maskedIdentifier).toBe('a•••@example.com')
    expect(Date.parse(challenge.expiresAt) - Date.parse(challenge.resendAvailableAt)).toBe(270_000)
    expect(Date.parse(challenge.expiresAt) - Date.now()).toBeGreaterThanOrEqual(299_750)
    await settle(api.verifyCode({ challengeId: challenge.challengeId, code: '123456' }, signal()))
    expect(network).not.toHaveBeenCalled()
  })
  it('rejects an incorrect code but lets the same challenge be retried', async () => {
    const api = createPreviewAuthApi()
    const challenge = await settle(api.requestCode(identity, signal()))
    const rejected = expect(api.verifyCode({ challengeId: challenge.challengeId, code: '654321' }, signal())).rejects.toMatchObject({ code: 'INVALID_CODE' })
    await vi.advanceTimersByTimeAsync(250); await rejected
    await settle(api.verifyCode({ challengeId: challenge.challengeId, code: '123456' }, signal()))
  })
  it('rejects the correct code after its five-minute expiry', async () => {
    const api = createPreviewAuthApi()
    const challenge = await settle(api.requestCode(identity, signal()))
    vi.setSystemTime(Date.parse(challenge.expiresAt))
    const rejected = expect(api.verifyCode({ challengeId: challenge.challengeId, code: '123456' }, signal())).rejects.toMatchObject({ code: 'CODE_EXPIRED' })
    await vi.advanceTimersByTimeAsync(250); await rejected
  })
  it('enforces the 30-second resend interval and replaces the previous challenge', async () => {
    const api = createPreviewAuthApi()
    const first = await settle(api.requestCode(identity, signal()))
    const early = expect(api.requestCode(identity, signal())).rejects.toMatchObject({ code: 'RATE_LIMITED' })
    await vi.advanceTimersByTimeAsync(250); await early
    vi.setSystemTime(Date.parse(first.resendAvailableAt))
    const second = await settle(api.requestCode(identity, signal()))
    expect(second.challengeId).not.toBe(first.challengeId)
    const stale = expect(api.verifyCode({ challengeId: first.challengeId, code: '123456' }, signal())).rejects.toMatchObject({ code: 'CODE_EXPIRED' })
    await vi.advanceTimersByTimeAsync(250); await stale
  })
  it('aborts a pending request without creating a challenge or blocking a new request', async () => {
    const api = createPreviewAuthApi()
    const controller = new AbortController()
    const rejected = expect(api.requestCode(identity, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort(); await rejected
    await settle(api.requestCode(identity, signal()))
  })
  it('aborts verification without consuming the code', async () => {
    const api = createPreviewAuthApi()
    const challenge = await settle(api.requestCode(identity, signal()))
    const input = { challengeId: challenge.challengeId, code: '123456' }
    const controller = new AbortController()
    const rejected = expect(api.verifyCode(input, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort(); await rejected
    await settle(api.verifyCode(input, signal()))
    const consumed = expect(api.verifyCode(input, signal())).rejects.toMatchObject({ code: 'CODE_EXPIRED' })
    await vi.advanceTimersByTimeAsync(250); await consumed
  })
})
