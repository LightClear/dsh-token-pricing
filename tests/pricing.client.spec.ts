/**
 * Pure pricing helpers: window math, route matching, cost computation,
 * per-turn/per-model aggregation, the legacy-entry migration, and
 * formatting. No render machinery — these are the functions the dock, the
 * floating window, and the settings page share.
 */

import { describe, expect, it } from 'vitest'
import {
  aggregateByModel, aggregateByTurn, billedTokens, computeCost, formatTokens, formatUsd,
  inAnyPeakWindow, inWindow, minutesOfDay, priceStep, resolveEntry, totalsOf,
} from '../src/client/pricing.ts'
import { TokenPricingEntrySchema } from '../src/settings.ts'
import type { TokenPricingEntry } from '../src/settings.ts'
import type { TokenPricingProjection, TokenPricingStep } from '../src/types.ts'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'

const ENTRY: TokenPricingEntry = {
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  inputMissPrice: 0.28,
  inputHitPrice: 0.07,
  outputPrice: 0.42,
  peakEnabled: false,
  peakWindows: [{ start: '09:00', end: '18:00' }],
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

function step(overrides: Partial<TokenPricingStep> = {}): TokenPricingStep {
  return {
    step: 1,
    provider: 'deepseek-official',
    model: 'deepseek-chat',
    time: new Date(2025, 0, 1, 10, 0).getTime(),
    inputTokens: 100_000,
    cacheReadTokens: 50_000,
    cacheWriteTokens: 10_000,
    outputTokens: 2_000,
    ...overrides,
  }
}

function projection(turns: TokenPricingProjection['turns']): TokenPricingProjection {
  return { turns }
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

describe('inAnyPeakWindow', () => {
  const windows = [
    { start: '08:00', end: '10:00' },
    { start: '22:00', end: '23:00' },
  ]

  it('hits while any window contains the instant', () => {
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 8, 0))).toBe(true)
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 9, 59))).toBe(true)
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 22, 30))).toBe(true)
  })

  it('misses outside every window', () => {
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 7, 59))).toBe(false)
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 12, 0))).toBe(false)
    expect(inAnyPeakWindow(windows, 'local', new Date(2025, 0, 1, 23, 0))).toBe(false)
  })

  it('misses for an empty window list', () => {
    expect(inAnyPeakWindow([], 'local', new Date(2025, 0, 1, 12, 0))).toBe(false)
  })

  it('honours the entry timezone basis', () => {
    const utc = new Date('2025-01-01T09:00:00Z')
    expect(inAnyPeakWindow(windows, 'utc', utc)).toBe(true)
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

  it('selects peak rates inside any window and off-peak outside all of them', () => {
    const peak: TokenPricingEntry = {
      ...ENTRY,
      peakEnabled: true,
      peakWindows: [
        { start: '08:00', end: '10:00' },
        { start: '22:00', end: '23:00' },
      ],
    }
    const inside = computeCost(peak, USAGE, new Date(2025, 0, 1, 9, 0))
    expect(inside.tier).toBe('peak')
    expect(inside.miss).toBe(0.14)
    expect(inside.hit).toBe(0.035)
    expect(inside.out).toBe(0.21)
    const second = computeCost(peak, USAGE, new Date(2025, 0, 1, 22, 30))
    expect(second.tier).toBe('peak')
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

describe('priceStep', () => {
  it('prices a matched step at its own time', () => {
    const priced = priceStep([ENTRY], step({ time: new Date(2025, 0, 1, 22, 0).getTime() }))
    expect(priced.entry).toBe(ENTRY)
    expect(priced.cost?.total).toBeCloseTo(0.03514, 10)
  })

  it('returns no entry or cost for an unconfigured route', () => {
    const priced = priceStep([ENTRY], step({ provider: 'other', model: 'deepseek-chat' }))
    expect(priced.entry).toBeUndefined()
    expect(priced.cost).toBeUndefined()
  })
})

describe('aggregateByModel', () => {
  const entries = [ENTRY]

  it('folds steps into per-route rows ordered by first appearance', () => {
    const rows = aggregateByModel(projection([
      { turn: 1, startTime: 100, steps: [step()] },
      { turn: 2, startTime: 200, steps: [
        step({ step: 1, model: 'other-model', outputTokens: 1_000, cacheReadTokens: 0, cacheWriteTokens: 0, inputTokens: 0 }),
        step({ step: 2 }),
      ] },
    ]), entries)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.model).toBe('deepseek-chat')
    expect(rows[1]?.model).toBe('other-model')
    expect(rows[0]?.steps).toBe(2)
    expect(rows[0]?.inputTokens).toBe(160_000 * 2)
    expect(rows[0]?.outputTokens).toBe(4_000)
    expect(rows[0]?.total).toBeCloseTo(0.03514 * 2, 10)
    expect(rows[0]?.entry).toBe(ENTRY)
  })

  it('keeps token counts but no costs for unconfigured routes', () => {
    const rows = aggregateByModel(projection([
      { turn: 1, startTime: 100, steps: [step({ provider: 'other' })] },
    ]), entries)
    expect(rows[0]?.entry).toBeUndefined()
    expect(rows[0]?.inputTokens).toBe(160_000)
    expect(rows[0]?.total).toBe(0)
  })
})

describe('aggregateByTurn', () => {
  const entries = [ENTRY]

  it('groups usage-bearing turns in turn order and omits empty ones', () => {
    const turns = aggregateByTurn(projection([
      { turn: 1, startTime: 100, steps: [] },
      { turn: 2, startTime: 200, steps: [step({ step: 1 }), step({ step: 2, model: 'other-model' })] },
    ]), entries)
    expect(turns).toHaveLength(1)
    expect(turns[0]?.turn).toBe(2)
    expect(turns[0]?.startTime).toBe(200)
    expect(turns[0]?.models.map(model => model.model)).toEqual(['deepseek-chat', 'other-model'])
    expect(turns[0]?.models[1]?.entry).toBeUndefined()
  })

  it('splits a mid-turn model switch into one row per route', () => {
    const turns = aggregateByTurn(projection([
      { turn: 1, startTime: 100, steps: [
        step({ step: 1 }),
        step({ step: 2, provider: 'b', model: 'model-b' }),
        step({ step: 3 }),
      ] },
    ]), entries)
    expect(turns[0]?.models.map(model => `${model.provider}/${model.model}`))
      .toEqual(['deepseek-official/deepseek-chat', 'b/model-b'])
    // The two deepseek-chat steps fold into the route's first row.
    expect(turns[0]?.models[0]?.steps).toBe(2)
    expect(turns[0]?.models[0]?.outputTokens).toBe(4_000)
  })
})

describe('totalsOf', () => {
  it('sums priced rows and ignores unpriced ones', () => {
    const rows = aggregateByModel(projection([
      { turn: 1, startTime: 100, steps: [step(), step({ provider: 'other' })] },
    ]), [ENTRY])
    const totals = totalsOf(rows)
    expect(totals.inputCost).toBeCloseTo(0.0343, 10)
    expect(totals.outputCost).toBeCloseTo(0.00084, 10)
    expect(totals.total).toBeCloseTo(0.03514, 10)
  })
})

describe('TokenPricingEntrySchema migration', () => {
  it('folds a legacy single-window entry into peakWindows', () => {
    const migrated = TokenPricingEntrySchema({
      provider: 'p',
      model: 'm',
      inputMissPrice: 0.28,
      inputHitPrice: 0.07,
      outputPrice: 0.42,
      peakEnabled: true,
      peakStart: '08:00',
      peakEnd: '20:00',
      peakTimeZone: 'utc',
      peakInputMissPrice: 0.14,
      peakInputHitPrice: 0.035,
      peakOutputPrice: 0.21,
    } as unknown as TokenPricingEntry)
    expect(migrated.peakWindows).toEqual([{ start: '08:00', end: '20:00' }])
    expect(migrated.peakTimeZone).toBe('utc')
    expect(migrated.peakEnabled).toBe(true)
    expect('peakStart' in migrated).toBe(false)
  })

  it('passes an already-migrated entry through unchanged', () => {
    const migrated = TokenPricingEntrySchema(ENTRY)
    expect(migrated).toEqual(ENTRY)
  })

  it('seeds the default window when no window shape is present', () => {
    const migrated = TokenPricingEntrySchema({
      provider: 'p',
      model: 'm',
    } as unknown as TokenPricingEntry)
    expect(migrated.peakWindows).toEqual([{ start: '09:00', end: '18:00' }])
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
