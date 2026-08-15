// @vitest-environment jsdom
/**
 * PricingDock render behavior: the readout shows the whole-session
 * input/output/total cost derived from the `tokenPricing` projection under
 * the pricing scope — no model name, no api. Unpriced usage renders nothing.
 * The component reads no services — everything arrives as props.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PricingDock } from '../src/client/PricingDock.tsx'
import type { PricingDockProps } from '../src/client/PricingDock.tsx'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { TokenPricingEntry, TokenPricingSettings } from '../src/settings.ts'
import type { TokenPricingProjection } from '../src/types.ts'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const ENTRY: TokenPricingEntry = {
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  inputMissPrice: 0.28,
  inputHitPrice: 0.07,
  outputPrice: 0.42,
  peakEnabled: false,
  peakWindows: [{ start: '09:00', end: '18:00' }],
  peakTimeZone: 'local',
  peakInputMissPrice: 0.14,
  peakInputHitPrice: 0.035,
  peakOutputPrice: 0.21,
}

// One step at 10:00 local: (100K + 10K) × $0.28 + 50K × $0.07 = $0.0343
// input; 2K × $0.42 = $0.00084 output; total $0.03514.
const PROJECTION: TokenPricingProjection = {
  turns: [{
    turn: 1,
    startTime: new Date(2025, 0, 1, 10, 0).getTime(),
    steps: [{
      step: 1,
      provider: 'deepseek-official',
      model: 'deepseek-chat',
      time: new Date(2025, 0, 1, 10, 0).getTime(),
      inputTokens: 100_000,
      cacheReadTokens: 50_000,
      cacheWriteTokens: 10_000,
      outputTokens: 2_000,
    }],
  }],
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
    useProjection: (() => PROJECTION) as unknown as PricingDockProps['useProjection'],
    usePricing: (() => snapshot()) as unknown as PricingDockProps['usePricing'],
    ...overrides,
  }
}

describe('PricingDock', () => {
  it('renders input, output, and total cost without a model name', () => {
    render(<PricingDock {...props()} />)
    expect(screen.getByText('输入 $0.0343')).toBeTruthy()
    expect(screen.getByText('输出 $0.00084')).toBeTruthy()
    expect(screen.getByText('总计 $0.0351')).toBeTruthy()
    expect(screen.queryByText('deepseek-chat')).toBeNull()
  })

  it('renders nothing while the projection is absent or has no steps', () => {
    const { container } = render(<PricingDock {...props({ useProjection: (() => undefined) as never })} />)
    expect(container.innerHTML).toBe('')
    cleanup()
    const { container: emptyContainer } = render(
      <PricingDock {...props({ useProjection: (() => ({ turns: [] })) as never })} />,
    )
    expect(emptyContainer.innerHTML).toBe('')
  })

  it('renders nothing while no used route has a pricing entry', () => {
    const unconfigured = { ...PROJECTION, turns: [{ ...PROJECTION.turns[0]!, steps: [{ ...PROJECTION.turns[0]!.steps[0]!, model: 'other-model' }] }] }
    const { container } = render(<PricingDock {...props({ useProjection: (() => unconfigured) as never })} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing while the pricing snapshot is absent', () => {
    const { container } = render(<PricingDock {...props({ usePricing: (() => undefined) as never })} />)
    expect(container.innerHTML).toBe('')
  })

  it('sums mixed configured and unconfigured routes over the configured ones', () => {
    const mixed: TokenPricingProjection = {
      turns: [{
        turn: 1,
        startTime: 100,
        steps: [
          ...PROJECTION.turns[0]!.steps,
          { ...PROJECTION.turns[0]!.steps[0]!, step: 2, model: 'other-model' },
        ],
      }],
    }
    render(<PricingDock {...props({ useProjection: (() => mixed) as never })} />)
    expect(screen.getByText('总计 $0.0351')).toBeTruthy()
  })
})
