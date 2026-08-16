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
import { TOKEN_PRICING_NAMESPACE } from "../settings.js";
import { PricingDock } from "./PricingDock.js";
import { PricingFloat } from "./PricingFloat.js";
import { PricingSection } from "./PricingSection.js";
/** Required services: both seats, the settings transport, and the RPC face. */
export const inject = ['slots', 'settingsScope', 'connection', 'remote'];
/**
 * Mount the dock readout, the floating window, and the settings section.
 * @param ctx - client root context.
 */
export function apply(ctx) {
    const pricingScope = ctx.settingsScope.bind({ namespace: TOKEN_PRICING_NAMESPACE });
    const connection = ctx.get('connection');
    const api = connection.api;
    const saveEntries = async (entries) => {
        await pricingScope.set('entries', entries);
        return pricingScope.getSnapshot();
    };
    ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
        name: 'conversation.composer.dock',
        id: 'model-pricing',
        order: 20,
        inject: () => ({ hooks: { pricing: pricingScope } }),
    }, PricingDock));
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'pricing-float',
        inject: () => ({ hooks: { pricing: pricingScope } }),
    }, PricingFloat));
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'model-pricing',
        order: 30,
        label: () => '模型定价',
        inject: () => ({ hooks: { pricing: pricingScope }, api, saveEntries }),
    }, PricingSection));
}
//# sourceMappingURL=index.js.map