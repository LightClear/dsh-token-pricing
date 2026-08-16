/**
 * PricingSection: the "模型定价" settings page, styled after the Models
 * settings page. One card per provider route (catalog from `llm.models`),
 * each listing its models with a configured/unconfigured dot and an editor
 * for the three base rates plus the optional peak-hour rate set. Drafts live
 * in component state; 保存配置 writes the whole entries list through the
 * settings scope, and the scope refresh re-syncs the form with host truth.
 */
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client';
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client';
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots';
import type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts';
/** One catalog provider group with its models. */
export interface CatalogGroup {
    id: string;
    name: string;
    models: {
        id: string;
        name: string;
    }[];
}
/** One failed provider catalog listing. */
export interface CatalogFailure {
    id: string;
    name: string;
    message: string;
}
/** Injected business face of the section entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingSectionInjected {
    hooks: {
        /** The durable pricing section, refreshed on every settings update. */
        pricing: SettingsScope<TokenPricingSettings>;
    };
    /** Wire faces for the host-scoped model catalog RPC. */
    api: IApiClient;
    /**
     * Persist the whole entries list through the settings scope and return the
     * post-write snapshot (the write's recovery read refreshes it), so the form
     * can tell a landed write from a rejected one.
     */
    saveEntries: (entries: TokenPricingEntry[]) => Promise<SettingsScopeSnapshot<TokenPricingSettings>>;
}
/** Composed props: the injected face plus the bound pricing scope hook. */
export type PricingSectionProps = {
    usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>;
    api: IApiClient;
    saveEntries: (entries: TokenPricingEntry[]) => Promise<SettingsScopeSnapshot<TokenPricingSettings>>;
};
/**
 * Render the pricing settings page.
 * @param props - the injected face plus the bound scope hook.
 * @returns the section content.
 */
export declare function PricingSection({ usePricing, api, saveEntries }: PricingSectionProps): import("react").JSX.Element;
//# sourceMappingURL=PricingSection.d.ts.map