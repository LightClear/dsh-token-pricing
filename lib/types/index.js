/**
 * Host registration for the token-pricing domain: the durable settings
 * section (the browser-owned per-model rates) and the `tokenPricing` session
 * projection (whole-log per-turn provider usage under each step's dispatch
 * route). The settings service is the package's purpose and a hard
 * dependency; the projection registry is an optional child, so assemblies
 * without it keep the settings surface and lose only the per-turn readout.
 * @module @deepseek-ai/dsh-client-token-pricing
 */
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { tokenPricingProjectionDefinition } from "./projection.js";
import { TOKEN_PRICING_NAMESPACE, TokenPricingSchema } from "./settings.js";
export { DEFAULT_PEAK_WINDOW, PEAK_TIME_ZONES, TOKEN_PRICING_NAMESPACE, } from "./settings.js";
/** Required services: the durable settings registry owns the rates section. */
export const inject = ['settings'];
/**
 * Register the durable token-pricing section, then the per-turn usage
 * projection unit where the projection registry exists.
 * @param ctx - Host context carrying the settings service.
 */
export function apply(ctx) {
    ctx.settings.register(settingsNamespace(TOKEN_PRICING_NAMESPACE), TokenPricingSchema, 
    // The browser pricing page reads and writes this section over the wire.
    { remote: true });
    ctx.inject(['sessionProjections'], (projectionCtx) => {
        projectionCtx.sessionProjections.register(tokenPricingProjectionDefinition);
    });
}
//# sourceMappingURL=index.js.map