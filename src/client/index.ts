/**
 * Token-pricing plugin, browser half: the cost readout in the
 * `conversation.composer.dock` band and the "模型定价" section in settings.
 * The durable entries arrive through the settings scope; the current session
 * route and the model catalog come from the `session.models` / `llm.models`
 * RPCs; token usage rides the `tokenUsage` projection. The node half only
 * registers the settings namespace, so this package adds no host RPC of its
 * own.
 * @module @deepseek-ai/dsh-client-token-pricing/client
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the settings.section SlotMap merge and the ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the conversation.composer.dock SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts'
import { TOKEN_PRICING_NAMESPACE } from '../settings.ts'
import { PricingDock } from './PricingDock.tsx'
import type { PricingDockInjected } from './PricingDock.tsx'
import { PricingSection } from './PricingSection.tsx'
import type { PricingSectionInjected } from './PricingSection.tsx'

export type { PricingDockProps, PricingDockInjected } from './PricingDock.tsx'
export type { PricingSectionProps, PricingSectionInjected } from './PricingSection.tsx'
export type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts'

/** Required services: both seats, the settings transport, and the RPC face. */
export const inject = ['slots', 'settingsScope', 'connection', 'remote']

/**
 * Mount the dock readout and the settings section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  const pricingScope = ctx.settingsScope.bind<TokenPricingSettings>({ namespace: TOKEN_PRICING_NAMESPACE })
  const connection = ctx.get('connection') as ConnectionHandle
  const api: IApiClient = connection.api

  const saveEntries = async (
    entries: TokenPricingEntry[],
  ): Promise<SettingsScopeSnapshot<TokenPricingSettings>> => {
    await pricingScope.set('entries', entries)
    return pricingScope.getSnapshot()
  }

  ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
    name: 'conversation.composer.dock',
    id: 'model-pricing',
    order: 20,
    inject: (): PricingDockInjected => ({ hooks: { pricing: pricingScope }, api }),
  }, PricingDock))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-pricing',
    order: 30,
    label: () => '模型定价',
    inject: (): PricingSectionInjected => ({ hooks: { pricing: pricingScope }, api, saveEntries }),
  }, PricingSection))
}
