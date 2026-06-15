export type Quota = { maxSeconds: number; usedSeconds: number }

export function createQuota(maxSeconds: number): Quota {
  return { maxSeconds, usedSeconds: 0 }
}

export function consumeQuota(quota: Quota, seconds: number): Quota {
  return {
    maxSeconds: quota.maxSeconds,
    usedSeconds: Math.min(quota.maxSeconds, quota.usedSeconds + seconds),
  }
}

export function getRemainingSeconds(quota: Quota): number {
  return quota.maxSeconds - quota.usedSeconds
}

export function isQuotaExhausted(quota: Quota): boolean {
  return quota.usedSeconds >= quota.maxSeconds
}
