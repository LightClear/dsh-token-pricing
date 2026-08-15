/**
 * PricingDock: the token-cost readout in the `conversation.composer.dock`
 * band, beside the shipped stats line. It shows the whole-session input /
 * output / total USD summed over every priced step of the `tokenPricing`
 * projection — no model name, no tier badge: the floating window owns the
 * per-turn and per-model detail. Each step is priced at its own time under
 * its dispatch route, so the readout matches the floating window's totals
 * exactly; a session whose usage has no configured price renders nothing.
 */

import { useMemo } from 'react'
import type { SettingsScope, SettingsScopeSnapshot, UseProjection } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { TokenPricingSettings } from '../settings.ts'
import { aggregateByModel, formatUsd, totalsOf } from './pricing.ts'
import css from './PricingDock.module.css'

/** Injected business face of the dock entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingDockInjected {
  hooks: {
    /** The durable pricing section, refreshed on every settings update. */
    pricing: SettingsScope<TokenPricingSettings>
  }
}

/** Composed props: the session standard kit plus the injected face. */
export type PricingDockProps = {
  useProjection: UseProjection
  usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>
}

/**
 * Render the dock readout, or nothing while no usage is priced.
 * @param props - the projection read seat plus the bound pricing scope hook.
 * @returns the readout row, or null when there is nothing priced to show.
 */
export function PricingDock({ useProjection, usePricing }: PricingDockProps) {
  const projection = useProjection('tokenPricing')
  // The bound hook lies about nullability: the renderer returns undefined
  // while its source is absent, so the result is widened back before the guard.
  const pricing = usePricing(snapshot => snapshot) as SettingsScopeSnapshot<TokenPricingSettings> | undefined
  const rows = useMemo(
    () => projection === undefined
      ? []
      : aggregateByModel(projection, pricing?.value?.entries ?? []),
    [projection, pricing],
  )
  if (rows.length === 0 || !rows.some(row => row.entry !== undefined)) return null
  const totals = totalsOf(rows)

  return (
    <div className={css.root}>
      <span>输入 {formatUsd(totals.inputCost)}</span>
      <span>输出 {formatUsd(totals.outputCost)}</span>
      <span className={css.total}>总计 {formatUsd(totals.total)}</span>
    </div>
  )
}
