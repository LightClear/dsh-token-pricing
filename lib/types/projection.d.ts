/**
 * The `tokenPricing` session projection unit: a pure fold of turn boundaries,
 * request headers, and assembled assistant messages into per-turn provider
 * usage facts under each step's dispatch route.
 *
 * The fold records usage only — no pricing entries and no USD. Rates live in
 * the settings scope, so the browser prices the projection at render time
 * and a retroactive entry edit reprises every historical step. Route
 * attribution replays `request/header` (appended before dispatch, on
 * change): the latest header's `config.provider`/`config.model` is exactly
 * the route the next `assistant/message` dispatched under. A legal log holds
 * one assembled message per step (`llm-retry` re-dispatches a failed stream
 * inside the same step without appending a second message), so a duplicate
 * guard matches the session-stats fold's defensive shape. Usage-absent
 * messages (adapters that report none) and compaction summaries (no usage
 * event at all) simply leave no step — the same coverage as the `tokenUsage`
 * meter.
 * @module @deepseek-ai/dsh-client-token-pricing/projection
 */
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import type { TokenPricingTurn } from './types.ts';
/** Fold state: the published turns plus the two replay facts that build them. */
interface TokenPricingState {
    turns: TokenPricingTurn[];
    /** The last recorded step, so a defensive duplicate cannot accrue twice. */
    last: {
        turn: number;
        step: number;
    } | null;
    /** Latest `request/header` route — the route the next message dispatched under. */
    route: {
        provider: string;
        model: string;
    };
}
/**
 * The per-turn pricing projection. State stays plain JSON per the unit
 * contract; `view` publishes only the turns, so the fold's route and
 * duplicate-guard slots never reach the wire.
 */
export declare const tokenPricingProjectionDefinition: ProjectionDefinition<'tokenPricing', TokenPricingState>;
export {};
//# sourceMappingURL=projection.d.ts.map