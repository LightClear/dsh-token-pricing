/**
 * Durable token-pricing section: per-provider/model USD rates per million
 * tokens, with an optional peak-hour window. Shared by the Host schema (the
 * `settings.register` wire envelope) and the browser scope (the settingsScope
 * value), so this module must stay browser-safe.
 * @module @deepseek-ai/dsh-client-token-pricing/settings
 */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the token-pricing plugin. */
export const TOKEN_PRICING_NAMESPACE = 'token-pricing'

/** Accepted peak-window timezone bases. */
export const PEAK_TIME_ZONES = ['local', 'utc'] as const

/** Timezone basis a peak window is evaluated in. */
export type PeakTimeZone = typeof PEAK_TIME_ZONES[number]

/** Rates for one provider/model route, in USD per 1M tokens. */
export interface TokenPricingEntry {
  /** Provider route key; an empty string matches any provider (legacy entries). */
  provider: string
  /** Provider-owned model id. */
  model: string
  /** Uncached-input (cache miss) rate; cache writes bill at this rate. */
  inputMissPrice: number
  /** Cache-read input (cache hit) rate. */
  inputHitPrice: number
  /** Output rate. */
  outputPrice: number
  /** Whether a peak-hour window selects between two rate sets. */
  peakEnabled: boolean
  /** Peak window start, HH:MM; a window whose end is earlier wraps past midnight. */
  peakStart: string
  /** Peak window end, HH:MM (exclusive). */
  peakEnd: string
  /** Timezone basis the window is evaluated in. */
  peakTimeZone: PeakTimeZone
  /** Peak-window uncached-input rate. */
  peakInputMissPrice: number
  /** Peak-window cache-hit rate. */
  peakInputHitPrice: number
  /** Peak-window output rate. */
  peakOutputPrice: number
}

/** The durable token-pricing section value. */
export interface TokenPricingSettings {
  entries: TokenPricingEntry[]
}

/** Schema for one provider/model rate entry. */
export const TokenPricingEntrySchema = z.object({
  provider: z.string().default(''),
  model: z.string().default(''),
  inputMissPrice: z.number().min(0).default(0),
  inputHitPrice: z.number().min(0).default(0),
  outputPrice: z.number().min(0).default(0),
  peakEnabled: z.boolean().default(false),
  peakStart: z.string().default('09:00'),
  peakEnd: z.string().default('18:00'),
  peakTimeZone: z.union([...PEAK_TIME_ZONES]).default('local'),
  peakInputMissPrice: z.number().min(0).default(0),
  peakInputHitPrice: z.number().min(0).default(0),
  peakOutputPrice: z.number().min(0).default(0),
})

/** Durable section schema; also the wire envelope the browser scope validates against. */
export const TokenPricingSchema: z<TokenPricingSettings> = z.object({
  entries: z.array(TokenPricingEntrySchema).default([]),
})
