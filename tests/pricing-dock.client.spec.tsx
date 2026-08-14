// @vitest-environment jsdom
/**
 * PricingDock render behavior: which routes and usage states render the
 * readout, what the row shows, and how the peak tier follows the injected
 * clock. The component reads no services — everything arrives as props.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PricingDock } from '../src/client/PricingDock.tsx'
import type { PricingDockProps } from '../src/client/PricingDock.tsx'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { TokenPricingEntry, TokenPricingSettings } from '../src/settings.ts'
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const USAGE: TokenUsageProjection = {
  uncachedInputTokens: 100_000,
  cacheReadTokens: 50_000,
  cacheWriteTokens: 0,
  outputTokens: 2_000,
}

const ENTRY: TokenPricingEntry = {
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  inputMissPrice: 0.28,
  inputHitPrice: 0.07,
  outputPrice: 0.42,
  peakEnabled: false,
  peakStart: '09:00',
  peakEnd: '18:00',
  peakTimeZone: 'local',
  peakInputMissPrice: 0.14,
  peakInputHitPrice: 0.035,
  peakOutputPrice: 0.21,
}

function snapshot(overrides: Partial<SettingsScopeSnapshot<TokenPricingSettings>> = {}): SettingsScopeSnapshot<TokenPricingSettings> {
  return {
    status: 'ready',
    value: { entries: [ENTRY] },
    base: undefined,
    user: undefined,
    revision: 0,
    writable: true,
    mode: 'host',
    ...overrides,
  }
}

function props(overrides: Partial<PricingDockProps> = {}): PricingDockProps {
  return {
    useProjection: (() => USAGE) as unknown as PricingDockProps['useProjection'],
    sessionId: 's1' as never,
    usePricing: (() => snapshot()) as unknown as PricingDockProps['usePricing'],
    api: {
      sessions: { models: async () => ({
        rpcId: 'r' as never,
        result: {
          ok: true,
          value: { current: { provider: 'deepseek-official', model: 'deepseek-chat' }, routable: true, groups: [], failures: [] },
        },
      }) },
    } as unknown as PricingDockProps['api'],
    ...overrides,
  }
}

describe('PricingDock', () => {
  it('renders input, output, and total cost for a matched route', async () => {
    render(<PricingDock {...props()} />)
    expect(await screen.findByText('deepseek-chat')).toBeTruthy()
    // 100K × $0.28 + 50K × $0.07 = $0.0315 input; 2K × $0.42 = $0.00084 output.
    expect(screen.getByText('输入 $0.0315')).toBeTruthy()
    expect(screen.getByText('输出 $0.00084')).toBeTruthy()
    expect(screen.getByText('总计 $0.0323')).toBeTruthy()
  })

  it('renders nothing while usage is absent or zero', () => {
    const { container } = render(<PricingDock {...props({ useProjection: (() => undefined) as never })} />)
    expect(container.innerHTML).toBe('')
    cleanup()
    const zero: TokenUsageProjection = { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 0 }
    const { container: zeroContainer } = render(<PricingDock {...props({ useProjection: (() => zero) as never })} />)
    expect(zeroContainer.innerHTML).toBe('')
  })

  it('renders nothing while the route has no pricing entry', async () => {
    const { container } = render(<PricingDock {...props({
      api: {
        sessions: { models: async () => ({
          rpcId: 'r' as never,
          result: {
            ok: true,
            value: { current: { provider: 'deepseek-official', model: 'other-model' }, routable: true, groups: [], failures: [] },
          },
        }) },
      } as never,
    })} />)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing while the pricing snapshot is absent', async () => {
    const { container } = render(<PricingDock {...props({ usePricing: (() => undefined) as never })} />)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(container.innerHTML).toBe('')
  })

  it('marks the peak tier and switches rates with the injected clock', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 10, 0))
    const peak = {
      ...ENTRY,
      peakEnabled: true,
      peakStart: '09:00',
      peakEnd: '18:00',
      peakInputMissPrice: 0.14,
      peakInputHitPrice: 0.035,
      peakOutputPrice: 0.21,
    }
    const usePricing = (() => snapshot({ value: { entries: [peak] } })) as unknown as PricingDockProps['usePricing']
    const { container } = render(<PricingDock {...props({ usePricing })} />)
    // vi.waitFor advances the faked timers; findByText's polling cannot.
    await vi.waitFor(() => { expect(screen.getByText('高峰价')).toBeTruthy() })
    // 100K × $0.14 + 50K × $0.035 = $0.01575 input; 2K × $0.21 = $0.00042 output.
    expect(screen.getByText('总计 $0.0162')).toBeTruthy()
    expect((container.querySelector('[title]') as HTMLElement | null)?.title).toContain('高峰时段')
  })

  it('does not mark a tier when the clock is outside the peak window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 1, 20, 0))
    const peak = {
      ...ENTRY,
      peakEnabled: true,
      peakStart: '09:00',
      peakEnd: '18:00',
    }
    const usePricing = (() => snapshot({ value: { entries: [peak] } })) as unknown as PricingDockProps['usePricing']
    render(<PricingDock {...props({ usePricing })} />)
    await vi.waitFor(() => { expect(screen.getByText('非高峰价')).toBeTruthy() })
    expect(screen.getByText('总计 $0.0323')).toBeTruthy()
  })
})
