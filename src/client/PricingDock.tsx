/**
 * PricingDock: the token-cost readout in the `conversation.composer.dock`
 * band, beside the shipped stats line. It shows input / output / total USD
 * for the session's cumulative token usage under the current route's matched
 * pricing entry; an unconfigured route, unknown route, or zero usage renders
 * nothing. The peak/off-peak tier follows the current time and refreshes once
 * a minute. All live data arrives through framework channels: the tokenUsage
 * projection, the settings scope hook, and the session.models RPC.
 */

import { useEffect, useState } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SessionId, SettingsScope, UseProjection } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { TokenPricingSettings } from '../settings.ts'
import { billedTokens, computeCost, formatTokens, formatUsd, resolveEntry } from './pricing.ts'
import css from './PricingDock.module.css'

/** Injected business face of the dock entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingDockInjected {
  hooks: {
    /** The durable pricing section, refreshed on every settings update. */
    pricing: SettingsScope<TokenPricingSettings>
  }
  /** Wire faces for the session-scoped model RPC. */
  api: IApiClient
}

/** Composed props: the session standard kit plus the injected face. */
export type PricingDockProps = {
  useProjection: UseProjection
  sessionId: SessionId
  usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>
  api: IApiClient
}

/**
 * Render the dock readout, or nothing while the route is unconfigured.
 * @param props - the session standard kit plus the injected face.
 * @returns the readout row, or null when there is nothing to price.
 */
export function PricingDock({ useProjection, sessionId, usePricing, api }: PricingDockProps) {
  const usage = useProjection('tokenUsage')
  // The bound hook lies about nullability: the renderer returns undefined
  // while its source is absent, so the result is widened back before the guard.
  const pricing = usePricing(snapshot => snapshot) as SettingsScopeSnapshot<TokenPricingSettings> | undefined
  const [current, setCurrent] = useState<{ provider: string; model: string } | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // The session's authoritative current route; refetched when the usage
  // projection moves so a mid-session model switch is picked up.
  useEffect(() => {
    let alive = true
    api.sessions.models({ sessionId }).then((response) => {
      if (!alive || !response.result.ok) return
      setCurrent({
        provider: response.result.value.current.provider,
        model: response.result.value.current.model,
      })
    }).catch(() => {})
    return () => { alive = false }
  }, [api, sessionId, usage])

  // Keep the peak/off-peak tier fresh across hour boundaries.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (usage === undefined || billedTokens(usage) === 0 || pricing === undefined) return null
  const entry = resolveEntry(pricing.value?.entries ?? [], current)
  if (entry === undefined) return null
  const cost = computeCost(entry, usage, new Date(now))

  const route = current === null ? '未知' : `${current.provider}/${current.model}`
  const tip = [
    `模型: ${route}`,
    `输入: ${formatUsd(cost.inputCost)}（未命中 ${formatTokens(cost.inputTokens)} × ${formatUsd(cost.miss)}/M + 命中 ${formatTokens(cost.hitTokens)} × ${formatUsd(cost.hit)}/M）`,
    `输出: ${formatUsd(cost.outputCost)}（${formatTokens(cost.outputTokens)} × ${formatUsd(cost.out)}/M）`,
    `总计: ${formatUsd(cost.total)}`,
    cost.tier === null
      ? '当前: 固定价格'
      : `当前: ${cost.tier === 'peak' ? `高峰时段 ${entry.peakStart}–${entry.peakEnd}` : '非高峰时段'}（${entry.peakTimeZone === 'utc' ? 'UTC' : '本地时间'}）`,
  ]

  return (
    <div className={css.root} title={tip.join('\n')}>
      <span>{current === null ? '' : current.model}</span>
      <span>输入 {formatUsd(cost.inputCost)}</span>
      <span>输出 {formatUsd(cost.outputCost)}</span>
      <span className={css.total}>总计 {formatUsd(cost.total)}</span>
      {cost.tier !== null && (
        <span className={cost.tier === 'peak' ? css.peak : css.offpeak}>
          {cost.tier === 'peak' ? '高峰价' : '非高峰价'}
        </span>
      )}
    </div>
  )
}
