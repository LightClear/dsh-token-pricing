/**
 * Host registration for the durable token-pricing settings section. The
 * browser half reads and writes the section through the settings scope
 * (`settingsScope`) and derives everything else (model catalog, current
 * session route, token usage) from existing host services, so this node half
 * owns exactly one effect.
 * @module @deepseek-ai/dsh-client-token-pricing
 */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { TOKEN_PRICING_NAMESPACE, TokenPricingSchema } from './settings.ts'

export {
  TOKEN_PRICING_NAMESPACE,
  type PeakTimeZone, type TokenPricingEntry, type TokenPricingSettings,
} from './settings.ts'

/**
 * Register the durable token-pricing section when a settings provider exists.
 * @param ctx - Host context whose optional settings service owns the section.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace(TOKEN_PRICING_NAMESPACE),
      TokenPricingSchema,
    )
  })
}
