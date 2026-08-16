/**
 * PricingDock: the token-cost readout in the `conversation.composer.dock`
 * band, beside the shipped stats line. It shows the whole-session input /
 * output / total USD summed over every priced step of the `tokenPricing`
 * projection — no model name, no tier badge: the floating window owns the
 * per-turn and per-model detail. Each step is priced at its own time under
 * its dispatch route, so the readout matches the floating window's totals
 * exactly; a session whose usage has no configured price renders nothing.
 */
import type { SettingsScope, SettingsScopeSnapshot, UseProjection } from '@deepseek-ai/dsh-client-runtime/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { TokenPricingSettings } from '../settings.ts';
/** Injected business face of the dock entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingDockInjected {
    hooks: {
        /** The durable pricing section, refreshed on every settings update. */
        pricing: SettingsScope<TokenPricingSettings>;
    };
}
/** Composed props: the session standard kit plus the injected face. */
export type PricingDockProps = {
    useProjection: UseProjection;
    usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>;
};
/**
 * Render the dock readout, or nothing while no usage is priced.
 * @param props - the projection read seat plus the bound pricing scope hook.
 * @returns the readout row, or null when there is nothing priced to show.
 */
export declare function PricingDock({ useProjection, usePricing }: PricingDockProps): import("react").JSX.Element | null;
//# sourceMappingURL=PricingDock.d.ts.map