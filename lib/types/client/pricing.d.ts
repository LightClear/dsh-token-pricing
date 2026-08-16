/**
 * Pure token-cost computation over a pricing section. Browser-safe and
 * deliberately framework-free: the dock readout, the floating window, and
 * the settings preview share it, and unit tests drive it without render
 * machinery. Cost math stays here — the `tokenPricing` projection only
 * carries usage facts, so every consumer prices them identically and a
 * retroactive entry edit reprises history.
 * @module @deepseek-ai/dsh-client-token-pricing/client/pricing
 */
import type { PeakTimeZone, PeakWindow, TokenPricingEntry } from '../settings.ts';
import type { TokenPricingProjection, TokenPricingStep } from '../types.ts';
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client';
/** A pricing route: provider plus provider-owned model id. */
export interface PricingCurrent {
    /** Registered provider route. */
    provider: string;
    /** Provider-owned model id. */
    model: string;
}
/**
 * Minutes of day for one date under one timezone basis.
 * @param date - the instant to read.
 * @param timezone - whether to read local or UTC wall time.
 * @returns minutes since midnight in that timezone basis.
 */
export declare function minutesOfDay(date: Date, timezone: 'local' | 'utc'): number;
/**
 * Whether a minute of day falls inside [start, end). An end earlier than the
 * start means the window wraps past midnight (22:00–08:00 covers 22:00–24:00
 * plus 00:00–08:00); a zero-length window covers the whole day.
 * @param start - window start, HH:MM.
 * @param end - window end, HH:MM.
 * @param nowMin - the minute of day to test.
 * @returns whether nowMin lies inside the window.
 */
export declare function inWindow(start: string, end: string, nowMin: number): boolean;
/**
 * Whether the instant falls inside any configured peak window. An entry
 * declares several disjoint peak periods; a hit in one selects the peak
 * rate set.
 * @param windows - the entry's peak windows.
 * @param timeZone - timezone basis the windows are evaluated in.
 * @param now - the instant to test.
 * @returns whether the peak rate set applies at `now`.
 */
export declare function inAnyPeakWindow(windows: readonly PeakWindow[], timeZone: PeakTimeZone, now: Date): boolean;
/**
 * First pricing entry whose model matches the current route and whose
 * provider, when non-empty, matches it too. No match means the route has no
 * configured price and the caller renders the unpriced state.
 * @param entries - configured pricing entries.
 * @param current - the route to match, or null when unknown.
 * @returns the matched entry, or undefined when none matches.
 */
export declare function resolveEntry(entries: readonly TokenPricingEntry[], current: PricingCurrent | null): TokenPricingEntry | undefined;
/** Cost figures for one usage view under one entry, in USD. */
export interface PricingCost {
    /** Billed input cost (uncached + cache-write at the miss rate, cache-read at the hit rate). */
    inputCost: number;
    /** Billed output cost. */
    outputCost: number;
    /** inputCost + outputCost. */
    total: number;
    /** Which rate set applied; null when peak pricing is disabled. */
    tier: 'peak' | 'offpeak' | null;
    /** Applied uncached-input rate. */
    miss: number;
    /** Applied cache-hit rate. */
    hit: number;
    /** Applied output rate. */
    out: number;
    /** Tokens billed at the miss rate (uncached + cache-write). */
    inputTokens: number;
    /** Tokens billed at the hit rate (cache-read). */
    hitTokens: number;
    /** Output tokens. */
    outputTokens: number;
}
/**
 * Price one cumulative usage view under one entry, selecting the peak or
 * off-peak rate set from the current time when peak pricing is enabled.
 * Cache-write tokens bill at the cache-miss rate (DeepSeek semantics).
 * @param entry - the matched pricing entry.
 * @param usage - the usage view to price.
 * @param now - the instant whose tier applies.
 * @returns the cost figures.
 */
export declare function computeCost(entry: TokenPricingEntry, usage: TokenUsageProjection, now: Date): PricingCost;
/**
 * Compact USD amount: two decimals at or above $1, four decimals down to
 * $0.01, up to six significant decimals below it, always `$0` for zero.
 * @param value - the amount to format.
 * @returns the display string.
 */
export declare function formatUsd(value: number): string;
/**
 * Compact token count: 517 / 12.2K / 1.2M (one decimal under three digits).
 * @param count - the token count to format.
 * @returns the display string.
 */
export declare function formatTokens(count: number): string;
/**
 * Sum of the four disjoint usage buckets; zero means no token activity.
 * @param usage - the usage view to sum.
 * @returns the total billed token count.
 */
export declare function billedTokens(usage: TokenUsageProjection): number;
/**
 * The usage-bucket view of one recorded step, so the projection's flat step
 * fields feed the same {@link computeCost} math as the token-meter buckets.
 * @param step - the recorded usage step.
 * @returns the four disjoint buckets.
 */
export declare function stepUsage(step: TokenPricingStep): TokenUsageProjection;
/** One step priced under its dispatch route; `cost` is undefined without a matching entry. */
export interface StepPricing {
    /** The priced step. */
    step: TokenPricingStep;
    /** The matched entry, or undefined when the route has no configured price. */
    entry: TokenPricingEntry | undefined;
    /** The cost under the matched entry; undefined when there is no entry. */
    cost: PricingCost | undefined;
}
/**
 * Price one recorded step under the entry matched to its dispatch route,
 * with the peak/off-peak tier evaluated at the step's own time.
 * @param entries - configured pricing entries.
 * @param step - the recorded usage step.
 * @returns the matched entry and the cost, or undefined entry/cost.
 */
export declare function priceStep(entries: readonly TokenPricingEntry[], step: TokenPricingStep): StepPricing;
/** One route's token and cost figures over some set of steps. */
export interface ModelPricing {
    /** Provider route. */
    provider: string;
    /** Provider-owned model id. */
    model: string;
    /** Billed input tokens (uncached + cache-read + cache-write). */
    inputTokens: number;
    /** Output tokens. */
    outputTokens: number;
    /** Summed input cost; 0 while the route has no configured entry. */
    inputCost: number;
    /** Summed output cost; 0 while the route has no configured entry. */
    outputCost: number;
    /** inputCost + outputCost. */
    total: number;
    /** Matched entry, or undefined when the route has no configured price. */
    entry: TokenPricingEntry | undefined;
    /** Usage-bearing steps folded into this row. */
    steps: number;
}
/**
 * Whole-session per-model figures — the "按模型计价" view. Rows appear in
 * first-use order.
 * @param projection - the `tokenPricing` projection value.
 * @param entries - configured pricing entries.
 * @returns one row per distinct route used in the session.
 */
export declare function aggregateByModel(projection: TokenPricingProjection, entries: readonly TokenPricingEntry[]): ModelPricing[];
/** One turn's per-route figures — a row of the "按轮计价" view. */
export interface TurnPricing {
    /** Host-assigned turn number. */
    turn: number;
    /** Turn start, epoch ms. */
    startTime: number;
    /** Per-route figures in first-use order; empty turns are omitted. */
    models: ModelPricing[];
}
/**
 * Whole-session per-turn figures — the "按轮计价" view. A turn that spans
 * several routes (a mid-turn model switch) carries one row per route, each
 * priced at its own steps' times. Turns without any usage-bearing step are
 * omitted.
 * @param projection - the `tokenPricing` projection value.
 * @param entries - configured pricing entries.
 * @returns one row per turn with usage, in turn order.
 */
export declare function aggregateByTurn(projection: TokenPricingProjection, entries: readonly TokenPricingEntry[]): TurnPricing[];
/** Whole-session cost totals over every priced route. */
export interface PricingTotals {
    /** Summed input cost. */
    inputCost: number;
    /** Summed output cost. */
    outputCost: number;
    /** inputCost + outputCost. */
    total: number;
}
/**
 * Sum cost totals over per-route rows. Unpriced rows contribute zero, so the
 * result covers exactly the configured routes.
 * @param rows - per-route figures.
 * @returns the summed totals.
 */
export declare function totalsOf(rows: readonly ModelPricing[]): PricingTotals;
//# sourceMappingURL=pricing.d.ts.map