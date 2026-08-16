/**
 * Token-pricing plugin, browser half: the cost readout in the
 * `conversation.composer.dock` band, the "模型定价" section in settings,
 * and the collapsible floating cost window on `shell.overlay`. The durable
 * entries arrive through the settings scope; the per-turn usage arrives as
 * the `tokenPricing` session projection (dock) or through the sessions list
 * rows (float — the overlay seat is root-scoped). The node half registers
 * the settings namespace and the projection unit; this package adds no host
 * RPC of its own.
 * @module @deepseek-ai/dsh-client-token-pricing/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
export type { PricingDockProps, PricingDockInjected } from './PricingDock.tsx';
export type { PricingFloatProps, PricingFloatInjected } from './PricingFloat.tsx';
export type { PricingSectionProps, PricingSectionInjected } from './PricingSection.tsx';
export type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts';
/** Required services: both seats, the settings transport, and the RPC face. */
export declare const inject: string[];
/**
 * Mount the dock readout, the floating window, and the settings section.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map