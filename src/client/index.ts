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

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the settings.section SlotMap merge and the ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the conversation.composer.dock SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the shell.overlay SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts'
import { TOKEN_PRICING_NAMESPACE } from '../settings.ts'
import { PricingDock } from './PricingDock.tsx'
import type { PricingDockInjected } from './PricingDock.tsx'
import { PricingFloat } from './PricingFloat.tsx'
import type { PricingFloatInjected } from './PricingFloat.tsx'
import { PricingSection } from './PricingSection.tsx'
import type { PricingSectionInjected } from './PricingSection.tsx'

export type { PricingDockProps, PricingDockInjected } from './PricingDock.tsx'
export type { PricingFloatProps, PricingFloatInjected } from './PricingFloat.tsx'
export type { PricingSectionProps, PricingSectionInjected } from './PricingSection.tsx'
export type { TokenPricingEntry, TokenPricingSettings } from '../settings.ts'

/** Required services: both seats, the settings transport, and the RPC face. */
export const inject = ['slots', 'settingsScope', 'connection', 'remote']

/**
 * Mount the dock readout, the floating window, and the settings section.
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
    inject: (): PricingDockInjected => ({ hooks: { pricing: pricingScope } }),
  }, PricingDock))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'pricing-float',
    inject: (): PricingFloatInjected => ({ hooks: { pricing: pricingScope } }),
  }, PricingFloat))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'model-pricing',
    order: 30,
    label: () => '模型定价',
    inject: (): PricingSectionInjected => ({ hooks: { pricing: pricingScope }, api, saveEntries }),
  }, PricingSection))
}
