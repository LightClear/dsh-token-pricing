// @vitest-environment jsdom
/**
 * PricingFloat render and interaction behavior: no-session absence, the
 * cost ball, expand/collapse, both views with their unpriced hints, and
 * drag-vs-click pointer handling. The component reads no services —
 * everything arrives as props.
 */

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PricingFloat } from '../src/client/PricingFloat.tsx'
import type { PricingFloatProps } from '../src/client/PricingFloat.tsx'
import type { SessionListState, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { TokenPricingEntry, TokenPricingSettings } from '../src/settings.ts'
import type { TokenPricingProjection } from '../src/types.ts'

afterEach(() => {
  cleanup()
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

// One priced step at 10:00 local: input $0.0343 + output $0.00084 =
// $0.03514, plus one unpriced step on another model.
const PROJECTION: TokenPricingProjection = {
  turns: [{
    turn: 1,
    startTime: new Date(2025, 0, 1, 10, 0).getTime(),
    steps: [
      {
        step: 1,
        provider: 'deepseek-official',
        model: 'deepseek-chat',
        time: new Date(2025, 0, 1, 10, 0).getTime(),
        inputTokens: 100_000,
        cacheReadTokens: 50_000,
        cacheWriteTokens: 10_000,
        outputTokens: 2_000,
      },
      {
        step: 2,
        provider: 'deepseek-official',
        model: 'other-model',
        time: new Date(2025, 0, 1, 10, 1).getTime(),
        inputTokens: 1_000,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 200,
      },
    ],
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

function sessions(state: SessionListState | null): SnapshotSelectorHook<SessionListState> {
  return ((selector: (s: SessionListState) => unknown) => selector(state as SessionListState)) as never
}

function props(overrides: Partial<PricingFloatProps> = {}): PricingFloatProps {
  return {
    useSessions: sessions({
      ids: ['s1' as never],
      byId: {
        's1': {
          id: 's1',
          displayTitle: 't',
          running: false,
          blank: false,
          updatedAt: 0,
          projectionValues: { tokenPricing: PROJECTION },
        },
      } as never,
      current: 's1' as never,
      phase: 'ready',
      subagentsByParent: {},
      jobsBySession: {},
      currentAddress: undefined,
    } as SessionListState),
    usePricing: (() => snapshot()) as unknown as PricingFloatProps['usePricing'],
    ...overrides,
  }
}

describe('PricingFloat', () => {
  it('renders nothing while no session is current', () => {
    const { container } = render(<PricingFloat {...props({
      useSessions: sessions({
        ids: [],
        byId: {},
        current: undefined,
        phase: 'ready',
        subagentsByParent: {},
        jobsBySession: {},
        currentAddress: undefined,
      } as SessionListState),
    })} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows the ball with the priced total and expands on click', () => {
    render(<PricingFloat {...props()} />)
    const ball = screen.getByRole('button', { name: '展开 token 费用' })
    expect(ball.textContent).toBe('$0.0351')
    fireEvent.click(ball)
    expect(screen.getByRole('dialog', { name: 'Token 费用' })).toBeTruthy()
    expect(screen.getByText('第 1 轮')).toBeTruthy()
    expect(screen.getByText('deepseek-chat')).toBeTruthy()
    // The priced route row and the footer total agree on the same figure.
    expect(screen.getAllByText('$0.0351')).toHaveLength(2)
    expect(screen.getAllByText('未设置计价')).toHaveLength(1)
  })

  it('shows per-model aggregates in the 按模型计价 view', () => {
    render(<PricingFloat {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: '展开 token 费用' }))
    fireEvent.click(screen.getByRole('tab', { name: '按模型计价' }))
    expect(screen.getByText('deepseek-chat')).toBeTruthy()
    expect(screen.getByText('other-model')).toBeTruthy()
    expect(screen.getAllByText('未设置计价')).toHaveLength(1)
    expect(screen.getAllByText('$0.0351')).toHaveLength(2)
  })

  it('collapses back to the ball through the close button', () => {
    render(<PricingFloat {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: '展开 token 费用' }))
    const panel = screen.getByRole('dialog')
    const close = screen.getByRole('button', { name: '折叠 token 费用' })
    // A press on the button must not start a drag (pointer capture would
    // retarget the button's click to the header)…
    fireEvent.pointerDown(close, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(close, { pointerId: 1, clientX: 60, clientY: 70 })
    fireEvent.pointerUp(close, { pointerId: 1 })
    expect(panel.style.transform).toBe('translateX(0px)')
    expect(panel.style.top).toBe('752px')
    // …and the click still collapses the panel.
    fireEvent.click(close)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: '展开 token 费用' })).toBeTruthy()
  })

  it('shows an empty state while the session has no usage', () => {
    const { container } = render(<PricingFloat {...props({
      useSessions: sessions({
        ids: ['s1' as never],
        byId: { 's1': { id: 's1', displayTitle: 't', running: false, blank: false, updatedAt: 0 } } as never,
        current: 's1' as never,
        phase: 'ready',
        subagentsByParent: {},
        jobsBySession: {},
        currentAddress: undefined,
      } as SessionListState),
    })} />)
    expect(container.querySelector('span')?.textContent).toBe('$0')
    fireEvent.click(screen.getByRole('button', { name: '展开 token 费用' }))
    expect(screen.getByText('暂无 token 用量')).toBeTruthy()
  })

  it('drags the ball by pointer without expanding', () => {
    render(<PricingFloat {...props()} />)
    const ball = screen.getByRole('button', { name: '展开 token 费用' })
    fireEvent.pointerDown(ball, { pointerId: 1, clientX: 400, clientY: 300 })
    fireEvent.pointerMove(ball, { pointerId: 1, clientX: 360, clientY: 270 })
    fireEvent.pointerUp(ball, { pointerId: 1 })
    expect(ball.style.transform).toBe('translate(-40px, -30px)')
    fireEvent.click(ball)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('drags the expanded panel by its footer, anchoring the top edge', () => {
    render(<PricingFloat {...props()} />)
    fireEvent.click(screen.getByRole('button', { name: '展开 token 费用' }))
    const panel = screen.getByRole('dialog')
    expect(panel.style.top).toBe('752px')
    const footer = screen.getByText('总计').parentElement as HTMLElement
    fireEvent.pointerDown(footer, { pointerId: 1, clientX: 400, clientY: 300 })
    fireEvent.pointerMove(footer, { pointerId: 1, clientX: 360, clientY: 270 })
    fireEvent.pointerUp(footer, { pointerId: 1 })
    expect(panel.style.transform).toBe('translateX(-40px)')
    // jsdom measures no layout, so panelHeight is 0: top = 768 - 16 - 0 - 30.
    expect(panel.style.top).toBe('722px')
    expect(panel.style.bottom).toBe('auto')
  })

  it('expands on a press without pointer travel', () => {
    render(<PricingFloat {...props()} />)
    const ball = screen.getByRole('button', { name: '展开 token 费用' })
    fireEvent.pointerDown(ball, { pointerId: 1, clientX: 400, clientY: 300 })
    fireEvent.pointerUp(ball, { pointerId: 1 })
    fireEvent.click(ball)
    expect(screen.getByRole('dialog', { name: 'Token 费用' })).toBeTruthy()
  })
})
