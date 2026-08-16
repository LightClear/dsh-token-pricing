/**
 * PricingFloat: the collapsible, draggable token-cost window mounted on
 * `shell.overlay`. Collapsed it is a small cost ball (the whole-session
 * total); expanded it is a panel with two views over the current session's
 * `tokenPricing` projection — per-turn rows (each turn's routes, tokens,
 * and cost, with an unpriced hint where no entry matches) and per-model
 * aggregates. Drag zones are the ball, the panel header (top), and the
 * panel footer (bottom); presses on buttons inside a zone (the collapse
 * button) keep ordinary click semantics. The expanded panel anchors its
 * TOP edge: `top` derives from the measured height, so switching views or
 * growing content extends the bottom edge instead of moving the header.
 * All figures derive from the same pure pricing helpers as the dock, so
 * the three surfaces cannot disagree.
 *
 * The overlay seat is root-scoped, so the current session and its live
 * projection arrive through `useSessions` (list rows carry host-computed
 * `projectionValues`); the durable rates arrive through the bound pricing
 * scope hook.
 */
import type { SessionListState, SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { TokenPricingSettings } from '../settings.ts';
/** Injected business face of the float entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingFloatInjected {
    hooks: {
        /** The durable pricing section, refreshed on every settings update. */
        pricing: SettingsScope<TokenPricingSettings>;
    };
}
/** Composed props: the root standard kit plus the injected face. */
export type PricingFloatProps = {
    useSessions: SnapshotSelectorHook<SessionListState>;
    usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>;
};
/**
 * Render the floating cost window, or nothing while no conversation is open.
 * @param props - the sessions and pricing hooks.
 * @returns the ball or the expanded panel.
 */
export declare function PricingFloat({ useSessions, usePricing }: PricingFloatProps): import("react").JSX.Element | null;
//# sourceMappingURL=PricingFloat.d.ts.map