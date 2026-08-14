/**
 * Pure pricing helpers: window math, route matching, cost computation, and
 * formatting. No render machinery — these are the functions the dock and the
 * settings page share.
 */

import { describe, expect, it } from 'vitest'
import {
  billedTokens, computeCost, formatTokens, formatUsd, inWindow, minutesOfDay, resolveEntry,
} from '../src/client/pricing.ts'
import type { TokenPricingEntry } from '../src/settings.ts'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'

const ENTRY: TokenPricingEntry = {
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  inputMissPrice: 0.28,
  inputHitPrice: 0.07,
  outputPrice: 0.42,
  peakEnabled: false,
  peakStart: '09:00',
  peakEnd: '18:00',
  peakTimeZone: 'local',
  peakInputMissPrice: 0.14,
  peakInputHitPrice: 0.035,
  peakOutputPrice: 0.21,
}

const USAGE: TokenUsageProjection = {
  uncachedInputTokens: 100_000,
  cacheReadTokens: 50_000,
  cacheWriteTokens: 10_000,
  outputTokens: 2_000,
}

describe('minutesOfDay', () => {
  it('reads local and UTC minutes', () => {
    const date = new Date(2025, 0, 1, 8, 30)
    expect(minutesOfDay(date, 'local')).toBe(8 * 60 + 30)
    const utc = new Date('2025-01-01T08:30:00Z')
    expect(minutesOfDay(utc, 'utc')).toBe(8 * 60 + 30)
  })
})

describe('inWindow', () => {
  it('covers a plain window', () => {
    expect(inWindow('09:00', '18:00', 9 * 60)).toBe(true)
    expect(inWindow('09:00', '18:00', 17 * 60 + 59)).toBe(true)
    expect(inWindow('09:00', '18:00', 8 * 60 + 59)).toBe(false)
    expect(inWindow('09:00', '18:00', 18 * 60)).toBe(false)
  })

  it('wraps past midnight', () => {
    expect(inWindow('22:00', '08:00', 23 * 60)).toBe(true)
    expect(inWindow('22:00', '08:00', 7 * 60 + 59)).toBe(true)
    expect(inWindow('22:00', '08:00', 21 * 60 + 59)).toBe(false)
    expect(inWindow('22:00', '08:00', 8 * 60)).toBe(false)
  })

  it('treats a zero-length window as the whole day', () => {
    expect(inWindow('00:00', '00:00', 0)).toBe(true)
    expect(inWindow('00:00', '00:00', 12 * 60)).toBe(true)
  })
})

describe('resolveEntry', () => {
  it('matches provider and model', () => {
    expect(resolveEntry([ENTRY], { provider: 'deepseek-official', model: 'deepseek-chat' })).toBe(ENTRY)
  })

  it('rejects a provider mismatch', () => {
    expect(resolveEntry([ENTRY], { provider: 'other', model: 'deepseek-chat' })).toBeUndefined()
  })

  it('rejects a model mismatch', () => {
    expect(resolveEntry([ENTRY], { provider: 'deepseek-official', model: 'other' })).toBeUndefined()
  })

  it('matches a provider-agnostic entry', () => {
    expect(resolveEntry([{ ...ENTRY, provider: '' }], { provider: 'any', model: 'deepseek-chat' })).toEqual({ ...ENTRY, provider: '' })
  })

  it('returns undefined for an unknown route', () => {
    expect(resolveEntry([ENTRY], null)).toBeUndefined()
    expect(resolveEntry([], { provider: 'a', model: 'b' })).toBeUndefined()
  })
})

describe('computeCost', () => {
  it('bills cache-write at the miss rate and cache-read at the hit rate', () => {
    const cost = computeCost(ENTRY, USAGE, new Date(2025, 0, 1, 10, 0))
    // (100K + 10K) × $0.28 + 50K × $0.07 = $0.0343; 2K × $0.42 = $0.00084.
    expect(cost.inputCost).toBeCloseTo(0.0343, 10)
    expect(cost.outputCost).toBeCloseTo(0.00084, 10)
    expect(cost.total).toBeCloseTo(0.03514, 10)
    expect(cost.tier).toBeNull()
    expect(cost.inputTokens).toBe(110_000)
    expect(cost.hitTokens).toBe(50_000)
  })

  it('selects peak rates inside the window and off-peak outside', () => {
    const peak = { ...ENTRY, peakEnabled: true }
    const inside = computeCost(peak, USAGE, new Date(2025, 0, 1, 10, 0))
    expect(inside.tier).toBe('peak')
    expect(inside.miss).toBe(0.14)
    expect(inside.hit).toBe(0.035)
    expect(inside.out).toBe(0.21)
    const outside = computeCost(peak, USAGE, new Date(2025, 0, 1, 20, 0))
    expect(outside.tier).toBe('offpeak')
    expect(outside.miss).toBe(0.28)
  })

  it('evaluates a UTC window against UTC time', () => {
    const peak = { ...ENTRY, peakEnabled: true, peakTimeZone: 'utc' as const }
    const cost = computeCost(peak, USAGE, new Date('2025-01-01T10:00:00Z'))
    expect(cost.tier).toBe('peak')
  })
})

describe('formatUsd', () => {
  it('formats zero, cents, and sub-cent amounts', () => {
    expect(formatUsd(0)).toBe('$0')
    expect(formatUsd(0.03234)).toBe('$0.0323')
    expect(formatUsd(0.00084)).toBe('$0.00084')
    expect(formatUsd(1.5)).toBe('$1.5')
    expect(formatUsd(12.34)).toBe('$12.34')
    expect(formatUsd(Number.NaN)).toBe('$0')
    expect(formatUsd(Number.POSITIVE_INFINITY)).toBe('$0')
  })
})

describe('formatTokens', () => {
  it('formats compact token counts', () => {
    expect(formatTokens(517)).toBe('517')
    expect(formatTokens(12_300)).toBe('12K')
    expect(formatTokens(1_234_567)).toBe('1.2M')
  })
})

describe('billedTokens', () => {
  it('sums the four disjoint buckets', () => {
    expect(billedTokens(USAGE)).toBe(162_000)
  })
})
