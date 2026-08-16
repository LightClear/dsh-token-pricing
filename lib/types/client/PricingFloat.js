import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { aggregateByModel, aggregateByTurn, formatTokens, formatUsd, totalsOf, } from "./pricing.js";
import css from './PricingFloat.module.css';
/** Frame margins the float keeps clear of the viewport edges, px. */
const EDGE = 16;
/** Pointer travel below which a press counts as a click, not a drag, px. */
const DRAG_THRESHOLD = 3;
/** Wall-clock HH:MM of a turn's start for the per-turn header. */
function formatTurnTime(ms) {
    const date = new Date(ms);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
/** Tokens line shared by both views: `输入 12.3K · 输出 1.2K`. */
function tokenLine(inputTokens, outputTokens) {
    return `输入 ${formatTokens(inputTokens)} · 输出 ${formatTokens(outputTokens)}`;
}
/**
 * Render the floating cost window, or nothing while no conversation is open.
 * @param props - the sessions and pricing hooks.
 * @returns the ball or the expanded panel.
 */
export function PricingFloat({ useSessions, usePricing }) {
    const projection = useSessions((state) => {
        const id = state.current;
        if (id === undefined)
            return undefined;
        return state.byId[id]?.projectionValues?.tokenPricing;
    });
    const hasSession = useSessions(state => state.current !== undefined);
    // The bound hook lies about nullability: the renderer returns undefined
    // while its source is absent, so the result is widened back before the guard.
    const pricing = usePricing(snapshot => snapshot);
    const view = useMemo(() => {
        const rows = projection === undefined
            ? []
            : aggregateByModel(projection, pricing?.value?.entries ?? []);
        return { rows, totals: totalsOf(rows) };
    }, [projection, pricing]);
    const [expanded, setExpanded] = useState(false);
    const [mode, setMode] = useState('turn');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [panelHeight, setPanelHeight] = useState(0);
    const rootRef = useRef(null);
    const dragRef = useRef(null);
    const movedRef = useRef(false);
    // Track the expanded panel's height and keep the stored offset valid for
    // it: the top edge stays anchored, so a taller or shorter body extends or
    // retracts the bottom edge (view switch, live projection growth).
    useLayoutEffect(() => {
        if (!expanded)
            return;
        const el = rootRef.current;
        if (el === null)
            return;
        const sync = () => {
            const maxUp = Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2);
            const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2);
            setPanelHeight(el.offsetHeight);
            setPosition(current => ({
                x: Math.min(0, Math.max(-maxLeft, current.x)),
                y: Math.min(0, Math.max(-maxUp, current.y)),
            }));
        };
        sync();
        if (typeof ResizeObserver === 'undefined')
            return;
        const observer = new ResizeObserver(sync);
        observer.observe(el);
        return () => { observer.disconnect(); };
    }, [expanded]);
    const onPointerDown = (event) => {
        // Presses on buttons (the collapse button) keep ordinary click
        // semantics: pointer capture would retarget their pointerup and click
        // to the drag zone, leaving the button unresponsive.
        const target = event.target;
        if (target instanceof Element && target.closest('button') !== null)
            return;
        // jsdom (and old browsers) lack pointer capture; dragging degrades to
        // pointermove-on-target there, which the tests do not exercise.
        if (typeof event.currentTarget.setPointerCapture === 'function') {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            baseX: position.x,
            baseY: position.y,
        };
        movedRef.current = false;
    };
    const onPointerMove = (event) => {
        const drag = dragRef.current;
        if (drag === null || drag.pointerId !== event.pointerId)
            return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD)
            movedRef.current = true;
        const el = rootRef.current;
        if (el === null)
            return;
        // Offsets stay non-positive (the resting position is the bottom-right
        // corner); the clamp keeps the whole float inside the viewport.
        const maxX = -Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2);
        const maxY = -Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2);
        setPosition({
            x: Math.min(0, Math.max(maxX, drag.baseX + dx)),
            y: Math.min(0, Math.max(maxY, drag.baseY + dy)),
        });
    };
    const onPointerUp = (event) => {
        if (dragRef.current?.pointerId !== event.pointerId)
            return;
        dragRef.current = null;
    };
    const onBallClick = () => {
        if (movedRef.current) {
            movedRef.current = false;
            return;
        }
        setExpanded(true);
    };
    if (!hasSession)
        return null;
    if (!expanded) {
        const transform = `translate(${position.x}px, ${position.y}px)`;
        return (_jsx("div", { ref: rootRef, className: css.root, style: { transform }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onClick: onBallClick, role: "button", "aria-expanded": false, "aria-label": "\u5C55\u5F00 token \u8D39\u7528", title: "Token \u8D39\u7528", children: _jsx("span", { className: css.ballLabel, children: formatUsd(view.totals.total) }) }));
    }
    const turns = projection === undefined ? [] : aggregateByTurn(projection, pricing?.value?.entries ?? []);
    // Top-anchored: the resting bottom edge sits EDGE above the viewport, and
    // the top derives from the measured height, so height changes extend the
    // bottom edge instead of moving the header.
    const top = window.innerHeight - EDGE - panelHeight + position.y;
    return (_jsxs("div", { ref: rootRef, className: `${css.root} ${css.panel}`, style: { top, bottom: 'auto', transform: `translateX(${position.x}px)` }, role: "dialog", "aria-label": "Token \u8D39\u7528", children: [_jsxs("div", { className: css.header, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, children: [_jsx("span", { className: css.title, children: "Token \u8D39\u7528" }), _jsx("button", { type: "button", className: css.collapseButton, onClick: () => { setExpanded(false); }, "aria-label": "\u6298\u53E0 token \u8D39\u7528", children: "\u00D7" })] }), _jsxs("div", { className: css.modes, role: "tablist", "aria-label": "\u8BA1\u4EF7\u89C6\u56FE", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'turn', className: mode === 'turn' ? `${css.mode} ${css.modeOn}` : css.mode, onClick: () => { setMode('turn'); }, children: "\u6309\u8F6E\u8BA1\u4EF7" }), _jsx("button", { type: "button", role: "tab", "aria-selected": mode === 'model', className: mode === 'model' ? `${css.mode} ${css.modeOn}` : css.mode, onClick: () => { setMode('model'); }, children: "\u6309\u6A21\u578B\u8BA1\u4EF7" })] }), _jsx("div", { className: css.body, children: mode === 'turn' ? (turns.length === 0
                    ? _jsx("p", { className: css.empty, children: "\u6682\u65E0 token \u7528\u91CF" })
                    : turns.map((turn) => (_jsxs("div", { className: css.turn, children: [_jsxs("div", { className: css.turnHead, children: [_jsxs("span", { children: ["\u7B2C ", turn.turn, " \u8F6E"] }), _jsx("span", { className: css.turnTime, children: formatTurnTime(turn.startTime) })] }), turn.models.map((model) => (_jsxs("div", { className: css.row, children: [_jsx("span", { className: css.model, children: model.model }), _jsx("span", { className: css.tokens, children: tokenLine(model.inputTokens, model.outputTokens) }), model.entry === undefined
                                        ? _jsx("span", { className: css.unpriced, children: "\u672A\u8BBE\u7F6E\u8BA1\u4EF7" })
                                        : _jsx("span", { className: css.cost, children: formatUsd(model.total) })] }, `${model.provider}\u0000${model.model}`)))] }, turn.turn)))) : (view.rows.length === 0
                    ? _jsx("p", { className: css.empty, children: "\u6682\u65E0 token \u7528\u91CF" })
                    : view.rows.map((row) => (_jsxs("div", { className: css.row, children: [_jsx("span", { className: css.model, children: row.model }), _jsx("span", { className: css.tokens, children: tokenLine(row.inputTokens, row.outputTokens) }), row.entry === undefined
                                ? _jsx("span", { className: css.unpriced, children: "\u672A\u8BBE\u7F6E\u8BA1\u4EF7" })
                                : _jsx("span", { className: css.cost, children: formatUsd(row.total) })] }, `${row.provider}\u0000${row.model}`)))) }), _jsxs("div", { className: css.footer, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, children: [_jsx("span", { children: "\u603B\u8BA1" }), _jsx("span", { className: css.total, children: formatUsd(view.totals.total) })] })] }));
}
//# sourceMappingURL=PricingFloat.js.map