import {
  createQuota,
  consumeQuota,
  isQuotaExhausted,
  getRemainingSeconds,
} from '@/lib/quota'

describe('quota tracker', () => {
  it('creates quota with full budget', () => {
    const q = createQuota(900)
    expect(getRemainingSeconds(q)).toBe(900)
    expect(isQuotaExhausted(q)).toBe(false)
  })

  it('consumes seconds from the budget', () => {
    const q = createQuota(900)
    const q2 = consumeQuota(q, 120)
    expect(getRemainingSeconds(q2)).toBe(780)
  })

  it('is exhausted when remaining is zero', () => {
    const q = createQuota(60)
    const q2 = consumeQuota(q, 60)
    expect(isQuotaExhausted(q2)).toBe(true)
  })

  it('clamps remaining to zero, never negative', () => {
    const q = createQuota(30)
    const q2 = consumeQuota(q, 999)
    expect(getRemainingSeconds(q2)).toBe(0)
    expect(isQuotaExhausted(q2)).toBe(true)
  })

  it('is immutable — original quota unchanged after consume', () => {
    const q = createQuota(900)
    consumeQuota(q, 100)
    expect(getRemainingSeconds(q)).toBe(900)
  })
})
