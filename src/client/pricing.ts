/**
 * Pure token-cost computation over a pricing section. Browser-safe and
 * deliberately framework-free: the dock readout and the settings preview
 * share it, and unit tests drive it without render machinery.
 * @module @deepseek-ai/dsh-client-token-pricing/client/pricing
 */

import type { TokenPricingEntry } from '../settings.ts'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'

/** The session's current provider/model route, as served by `session.models`. */
export interface PricingCurrent {
  /** Registered provider route. */
  provider: string
  /** Provider-owned model id. */
  model: string
}

/**
 * Minutes of day for one date under one timezone basis.
 * @param date - the instant to read.
 * @param timezone - whether to read local or UTC wall time.
 * @returns minutes since midnight in that timezone basis.
 */
export function minutesOfDay(date: Date, timezone: 'local' | 'utc'): number {
  return timezone === 'utc'
    ? date.getUTCHours() * 60 + date.getUTCMinutes()
    : date.getHours() * 60 + date.getMinutes()
}

function toMinutes(hhmm: string): number {
  const parts = hhmm.split(':')
  return Number(parts[0]) * 60 + Number(parts[1])
}

/**
 * Whether a minute of day falls inside [start, end). An end earlier than the
 * start means the window wraps past midnight (22:00–08:00 covers 22:00–24:00
 * plus 00:00–08:00); a zero-length window covers the whole day.
 */
export function inWindow(start: string, end: string, nowMin: number): boolean {
  const s = toMinutes(start)
  const e = toMinutes(end)
  if (s === e) return true
  return s < e ? nowMin >= s && nowMin < e : nowMin >= s || nowMin < e
}

/**
 * First pricing entry whose model matches the current route and whose
 * provider, when non-empty, matches it too. No match means the route has no
 * configured price and the caller renders nothing.
 * @param entries - configured pricing entries.
 * @param current - the session's current route, or null when unknown.
 * @returns the matched entry, or undefined when none matches.
 */
export function resolveEntry(
  entries: readonly TokenPricingEntry[],
  current: PricingCurrent | null,
): TokenPricingEntry | undefined {
  if (current === null) return undefined
  for (const entry of entries) {
    if (entry.model !== current.model) continue
    if (entry.provider !== '' && entry.provider !== current.provider) continue
    return entry
  }
  return undefined
}

/** Cost figures for one usage view under one entry, in USD. */
export interface PricingCost {
  /** Billed input cost (uncached + cache-write at the miss rate, cache-read at the hit rate). */
  inputCost: number
  /** Billed output cost. */
  outputCost: number
  /** inputCost + outputCost. */
  total: number
  /** Which rate set applied; null when peak pricing is disabled. */
  tier: 'peak' | 'offpeak' | null
  /** Applied uncached-input rate. */
  miss: number
  /** Applied cache-hit rate. */
  hit: number
  /** Applied output rate. */
  out: number
  /** Tokens billed at the miss rate (uncached + cache-write). */
  inputTokens: number
  /** Tokens billed at the hit rate (cache-read). */
  hitTokens: number
  /** Output tokens. */
  outputTokens: number
}

/**
 * Price one cumulative usage view under one entry, selecting the peak or
 * off-peak rate set from the current time when peak pricing is enabled.
 * Cache-write tokens bill at the cache-miss rate (DeepSeek semantics).
 */
export function computeCost(entry: TokenPricingEntry, usage: TokenUsageProjection, now: Date): PricingCost {
  const peak = entry.peakEnabled
    && inWindow(entry.peakStart, entry.peakEnd, minutesOfDay(now, entry.peakTimeZone))
  const miss = peak ? entry.peakInputMissPrice : entry.inputMissPrice
  const hit = peak ? entry.peakInputHitPrice : entry.inputHitPrice
  const out = peak ? entry.peakOutputPrice : entry.outputPrice
  const inputTokens = usage.uncachedInputTokens + usage.cacheWriteTokens
  const hitTokens = usage.cacheReadTokens
  const outputTokens = usage.outputTokens
  const inputCost = (inputTokens * miss + hitTokens * hit) / 1_000_000
  const outputCost = outputTokens * out / 1_000_000
  return {
    inputCost,
    outputCost,
    total: inputCost + outputCost,
    tier: entry.peakEnabled ? (peak ? 'peak' : 'offpeak') : null,
    miss, hit, out, inputTokens, hitTokens, outputTokens,
  }
}

/**
 * Compact USD amount: two decimals at or above $1, four decimals down to
 * $0.01, up to six significant decimals below it, always `$0` for zero.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '$0'
  if (value >= 1) return `$${value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`
  if (value >= 0.01) return `$${value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')}`
  return `$${value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`
}

/** Compact token count: 517 / 12.2K / 1.2M (one decimal under three digits). */
export function formatTokens(count: number): string {
  if (count < 1_000) return String(count)
  if (count < 1_000_000) return `${String(Math.round(count / 1_000))}K`
  return `${String(Math.round(count / 1_000_000 * 10) / 10)}M`
}

/** Sum of the four disjoint usage buckets; zero means no token activity. */
export function billedTokens(usage: TokenUsageProjection): number {
  return usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens
}
