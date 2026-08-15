/**
 * Durable token-pricing section: per-provider/model USD rates per million
 * tokens, with an optional peak rate set over any number of time windows.
 * Shared by the Host schema (the `settings.register` wire envelope) and the
 * browser scope (the settingsScope value), so this module must stay
 * browser-safe.
 * @module @deepseek-ai/dsh-client-token-pricing/settings
 */

import z from '@deepseek-ai/schemastery'

/** Settings namespace owned by the token-pricing plugin. */
export const TOKEN_PRICING_NAMESPACE = 'token-pricing'

/** Accepted peak-window timezone bases. */
export const PEAK_TIME_ZONES = ['local', 'utc'] as const

/** Timezone basis every peak window of an entry is evaluated in. */
export type PeakTimeZone = typeof PEAK_TIME_ZONES[number]

/**
 * One peak interval: `[start, end)` wall time in the entry's
 * {@link TokenPricingEntry.peakTimeZone}; an end earlier than the start
 * wraps past midnight (22:00–08:00 covers both legs), and a zero-length
 * window covers the whole day.
 */
export interface PeakWindow {
  /** Window start, HH:MM (inclusive). */
  start: string
  /** Window end, HH:MM (exclusive). */
  end: string
}

/** The single default peak window a freshly enabled entry starts from. */
export const DEFAULT_PEAK_WINDOW: PeakWindow = { start: '09:00', end: '18:00' }

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
  /** Whether the peak rate set applies inside the configured windows. */
  peakEnabled: boolean
  /**
   * Peak intervals; the current minute falling inside ANY window selects the
   * peak rate set, so an entry may declare several disjoint peak periods.
   * The settings UI keeps at least one window while peak pricing is enabled.
   */
  peakWindows: PeakWindow[]
  /** Timezone basis the windows are evaluated in. */
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

/**
 * Schema for one provider/model rate entry. A schemastery transform folds
 * legacy single-window entries (`peakStart`/`peakEnd`) into `peakWindows`,
 * so stored configurations survive the schema change: a legacy entry keeps
 * its window, and an entry already carrying `peakWindows` passes through
 * unchanged (the transform also drops the legacy keys, so the first save
 * writes the new shape). The callback is deliberately self-contained — the
 * settings wire serializes it to the browser, where it is rehydrated with
 * no access to this module's bindings.
 */
export const TokenPricingEntrySchema = z.transform(z.object({
  provider: z.string().default(''),
  model: z.string().default(''),
  inputMissPrice: z.number().min(0).default(0),
  inputHitPrice: z.number().min(0).default(0),
  outputPrice: z.number().min(0).default(0),
  peakEnabled: z.boolean().default(false),
  peakWindows: z.array(z.object({
    start: z.string().default('09:00'),
    end: z.string().default('18:00'),
  })),
  peakTimeZone: z.union([...PEAK_TIME_ZONES]).default('local'),
  peakInputMissPrice: z.number().min(0).default(0),
  peakInputHitPrice: z.number().min(0).default(0),
  peakOutputPrice: z.number().min(0).default(0),
  // Legacy single-window fields; the transform folds them into peakWindows.
  peakStart: z.string(),
  peakEnd: z.string(),
}), (entry) => {
  // The inner array schema defaults an absent peakWindows to [], so a legacy
  // entry (no window list, single-window fields present) is the empty-list
  // case with peakStart set. Legacy fields win there; an empty list without
  // them (a partial hand-edit) falls back to the default window.
  const configured = entry.peakWindows ?? []
  const windows = configured.length > 0
    ? configured
    : entry.peakStart != null
      ? [{ start: entry.peakStart, end: entry.peakEnd ?? '18:00' }]
      : [{ start: '09:00', end: '18:00' }]
  return {
    provider: entry.provider,
    model: entry.model,
    inputMissPrice: entry.inputMissPrice,
    inputHitPrice: entry.inputHitPrice,
    outputPrice: entry.outputPrice,
    peakEnabled: entry.peakEnabled,
    peakWindows: windows,
    peakTimeZone: entry.peakTimeZone,
    peakInputMissPrice: entry.peakInputMissPrice,
    peakInputHitPrice: entry.peakInputHitPrice,
    peakOutputPrice: entry.peakOutputPrice,
  }
}) as unknown as z<TokenPricingEntry>

/** Durable section schema; also the wire envelope the browser scope validates against. */
export const TokenPricingSchema: z<TokenPricingSettings> = z.object({
  entries: z.array(TokenPricingEntrySchema).default([]),
})
