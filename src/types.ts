/**
 * Pure types of the token-pricing domain: the ONE home of the `tokenPricing`
 * projection-key declaration. Browser-safe and runtime-free, so both the Host
 * fold (`projection.ts`) and the browser pricing math (`client/pricing.ts`)
 * import it; the declare-module merge below is what types the wire value and
 * the `useProjection('tokenPricing')` read end to end.
 * @module @deepseek-ai/dsh-client-token-pricing/types
 */

/**
 * Provider-reported usage of one assistant message, recorded under the
 * route it dispatched through. Usage facts only — no rates or costs enter
 * the projection, so retroactive pricing-entry edits reprice history.
 */
export interface TokenPricingStep {
  /** Step number within its turn. */
  step: number
  /** Provider route the step dispatched under; '' when the log carried no header (defensive). */
  provider: string
  /** Provider-owned model id the step dispatched under. */
  model: string
  /** Unix epoch ms of the usage record; peak/off-peak selection prices this moment. */
  time: number
  /** Uncached input tokens. */
  inputTokens: number
  /** Cache-read (hit) tokens. */
  cacheReadTokens: number
  /** Cache-write tokens (billed at the miss rate). */
  cacheWriteTokens: number
  /** Output tokens. */
  outputTokens: number
}

/** One conversation turn's usage-bearing steps in dispatch order. */
export interface TokenPricingTurn {
  /** Host-assigned turn number. */
  turn: number
  /** Unix epoch ms of the `turn/start` event. */
  startTime: number
  /** Steps that reported usage; a turn with none keeps an empty list. */
  steps: TokenPricingStep[]
}

/**
 * Whole-log per-turn provider usage with dispatch routes — the `tokenPricing`
 * projection view. Deriving this from the durable log is what makes per-turn
 * figures survive restart and travel with an archived session (archiving
 * hides the row but never rewrites the log).
 */
export interface TokenPricingProjection {
  turns: TokenPricingTurn[]
}

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    /** Per-turn per-step provider usage with dispatch routes; see {@link TokenPricingProjection}. */
    tokenPricing: TokenPricingProjection
  }
}
