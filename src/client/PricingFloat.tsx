/**
 * PricingFloat: the collapsible, draggable token-cost window mounted on
 * `shell.overlay`. Collapsed it is a small cost ball (the whole-session
 * total); expanded it is a panel with two views over the current session's
 * `tokenPricing` projection — per-turn rows (each turn's routes, tokens,
 * and cost, with an unpriced hint where no entry matches) and per-model
 * aggregates. Drag zones are the ball, the panel header (top), and the
 * panel footer (bottom); presses on buttons inside a zone (the collapse
 * button) keep ordinary click semantics. The expanded panel anchors its
 * TOP edge: `top` derives from the measured height, so switching views or
 * growing content extends the bottom edge instead of moving the header.
 * All figures derive from the same pure pricing helpers as the dock, so
 * the three surfaces cannot disagree.
 *
 * The overlay seat is root-scoped, so the current session and its live
 * projection arrive through `useSessions` (list rows carry host-computed
 * `projectionValues`); the durable rates arrive through the bound pricing
 * scope hook.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { SessionListState, SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { TokenPricingSettings } from '../settings.ts'
import {
  aggregateByModel, aggregateByTurn, formatTokens, formatUsd, totalsOf,
} from './pricing.ts'
import css from './PricingFloat.module.css'

/** Injected business face of the float entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingFloatInjected {
  hooks: {
    /** The durable pricing section, refreshed on every settings update. */
    pricing: SettingsScope<TokenPricingSettings>
  }
}

/** Composed props: the root standard kit plus the injected face. */
export type PricingFloatProps = {
  useSessions: SnapshotSelectorHook<SessionListState>
  usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>
}

/** Whole-session per-model rows plus their totals, derived once per render input. */
interface PricingView {
  rows: ReturnType<typeof aggregateByModel>
  totals: { inputCost: number; outputCost: number; total: number }
}

/** Frame margins the float keeps clear of the viewport edges, px. */
const EDGE = 16

/** Pointer travel below which a press counts as a click, not a drag, px. */
const DRAG_THRESHOLD = 3

/** Wall-clock HH:MM of a turn's start for the per-turn header. */
function formatTurnTime(ms: number): string {
  const date = new Date(ms)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Tokens line shared by both views: `输入 12.3K · 输出 1.2K`. */
function tokenLine(inputTokens: number, outputTokens: number): string {
  return `输入 ${formatTokens(inputTokens)} · 输出 ${formatTokens(outputTokens)}`
}

/**
 * Render the floating cost window, or nothing while no conversation is open.
 * @param props - the sessions and pricing hooks.
 * @returns the ball or the expanded panel.
 */
export function PricingFloat({ useSessions, usePricing }: PricingFloatProps) {
  const projection = useSessions((state) => {
    const id = state.current
    if (id === undefined) return undefined
    return state.byId[id]?.projectionValues?.tokenPricing
  })
  const hasSession = useSessions(state => state.current !== undefined)
  // The bound hook lies about nullability: the renderer returns undefined
  // while its source is absent, so the result is widened back before the guard.
  const pricing = usePricing(snapshot => snapshot) as SettingsScopeSnapshot<TokenPricingSettings> | undefined
  const view: PricingView = useMemo(() => {
    const rows = projection === undefined
      ? []
      : aggregateByModel(projection, pricing?.value?.entries ?? [])
    return { rows, totals: totalsOf(rows) }
  }, [projection, pricing])
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'turn' | 'model'>('turn')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [panelHeight, setPanelHeight] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const movedRef = useRef(false)

  // Track the expanded panel's height and keep the stored offset valid for
  // it: the top edge stays anchored, so a taller or shorter body extends or
  // retracts the bottom edge (view switch, live projection growth).
  useLayoutEffect(() => {
    if (!expanded) return
    const el = rootRef.current
    if (el === null) return
    const sync = (): void => {
      const maxUp = Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2)
      const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2)
      setPanelHeight(el.offsetHeight)
      setPosition(current => ({
        x: Math.min(0, Math.max(-maxLeft, current.x)),
        y: Math.min(0, Math.max(-maxUp, current.y)),
      }))
    }
    sync()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [expanded])

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    // Presses on buttons (the collapse button) keep ordinary click
    // semantics: pointer capture would retarget their pointerup and click
    // to the drag zone, leaving the button unresponsive.
    const target = event.target
    if (target instanceof Element && target.closest('button') !== null) return
    // jsdom (and old browsers) lack pointer capture; dragging degrades to
    // pointermove-on-target there, which the tests do not exercise.
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: position.x,
      baseY: position.y,
    }
    movedRef.current = false
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === null || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) movedRef.current = true
    const el = rootRef.current
    if (el === null) return
    // Offsets stay non-positive (the resting position is the bottom-right
    // corner); the clamp keeps the whole float inside the viewport.
    const maxX = -Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2)
    const maxY = -Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2)
    setPosition({
      x: Math.min(0, Math.max(maxX, drag.baseX + dx)),
      y: Math.min(0, Math.max(maxY, drag.baseY + dy)),
    })
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>): void => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
  }

  const onBallClick = (): void => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    setExpanded(true)
  }

  if (!hasSession) return null

  if (!expanded) {
    const transform = `translate(${position.x}px, ${position.y}px)`
    return (
      <div
        ref={rootRef}
        className={css.root}
        style={{ transform }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onBallClick}
        role="button"
        aria-expanded={false}
        aria-label="展开 token 费用"
        title="Token 费用"
      >
        <span className={css.ballLabel}>{formatUsd(view.totals.total)}</span>
      </div>
    )
  }

  const turns = projection === undefined ? [] : aggregateByTurn(projection, pricing?.value?.entries ?? [])
  // Top-anchored: the resting bottom edge sits EDGE above the viewport, and
  // the top derives from the measured height, so height changes extend the
  // bottom edge instead of moving the header.
  const top = window.innerHeight - EDGE - panelHeight + position.y
  return (
    <div
      ref={rootRef}
      className={`${css.root} ${css.panel}`}
      style={{ top, bottom: 'auto', transform: `translateX(${position.x}px)` }}
      role="dialog"
      aria-label="Token 费用"
    >
      <div
        className={css.header}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className={css.title}>Token 费用</span>
        <button
          type="button"
          className={css.collapseButton}
          onClick={() => { setExpanded(false) }}
          aria-label="折叠 token 费用"
        >
          ×
        </button>
      </div>
      <div className={css.modes} role="tablist" aria-label="计价视图">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'turn'}
          className={mode === 'turn' ? `${css.mode} ${css.modeOn}` : css.mode}
          onClick={() => { setMode('turn') }}
        >
          按轮计价
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'model'}
          className={mode === 'model' ? `${css.mode} ${css.modeOn}` : css.mode}
          onClick={() => { setMode('model') }}
        >
          按模型计价
        </button>
      </div>
      <div className={css.body}>
        {mode === 'turn' ? (
          turns.length === 0
            ? <p className={css.empty}>暂无 token 用量</p>
            : turns.map((turn) => (
              <div key={turn.turn} className={css.turn}>
                <div className={css.turnHead}>
                  <span>第 {turn.turn} 轮</span>
                  <span className={css.turnTime}>{formatTurnTime(turn.startTime)}</span>
                </div>
                {turn.models.map((model) => (
                  <div key={`${model.provider}\u0000${model.model}`} className={css.row}>
                    <span className={css.model}>{model.model}</span>
                    <span className={css.tokens}>{tokenLine(model.inputTokens, model.outputTokens)}</span>
                    {model.entry === undefined
                      ? <span className={css.unpriced}>未设置计价</span>
                      : <span className={css.cost}>{formatUsd(model.total)}</span>}
                  </div>
                ))}
              </div>
            ))
        ) : (
          view.rows.length === 0
            ? <p className={css.empty}>暂无 token 用量</p>
            : view.rows.map((row) => (
              <div key={`${row.provider}\u0000${row.model}`} className={css.row}>
                <span className={css.model}>{row.model}</span>
                <span className={css.tokens}>{tokenLine(row.inputTokens, row.outputTokens)}</span>
                {row.entry === undefined
                  ? <span className={css.unpriced}>未设置计价</span>
                  : <span className={css.cost}>{formatUsd(row.total)}</span>}
              </div>
            ))
        )}
      </div>
      <div
        className={css.footer}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span>总计</span>
        <span className={css.total}>{formatUsd(view.totals.total)}</span>
      </div>
    </div>
  )
}
