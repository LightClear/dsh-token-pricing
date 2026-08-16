import { jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PricingDock: the token-cost readout in the `conversation.composer.dock`
 * band, beside the shipped stats line. It shows the whole-session input /
 * output / total USD summed over every priced step of the `tokenPricing`
 * projection — no model name, no tier badge: the floating window owns the
 * per-turn and per-model detail. Each step is priced at its own time under
 * its dispatch route, so the readout matches the floating window's totals
 * exactly; a session whose usage has no configured price renders nothing.
 */
import { useMemo } from 'react';
import { aggregateByModel, formatUsd, totalsOf } from "./pricing.js";
import css from './PricingDock.module.css';
/**
 * Render the dock readout, or nothing while no usage is priced.
 * @param props - the projection read seat plus the bound pricing scope hook.
 * @returns the readout row, or null when there is nothing priced to show.
 */
export function PricingDock({ useProjection, usePricing }) {
    const projection = useProjection('tokenPricing');
    // The bound hook lies about nullability: the renderer returns undefined
    // while its source is absent, so the result is widened back before the guard.
    const pricing = usePricing(snapshot => snapshot);
    const rows = useMemo(() => projection === undefined
        ? []
        : aggregateByModel(projection, pricing?.value?.entries ?? []), [projection, pricing]);
    if (rows.length === 0 || !rows.some(row => row.entry !== undefined))
        return null;
    const totals = totalsOf(rows);
    return (_jsxs("div", { className: css.root, children: [_jsxs("span", { children: ["\u8F93\u5165 ", formatUsd(totals.inputCost)] }), _jsxs("span", { children: ["\u8F93\u51FA ", formatUsd(totals.outputCost)] }), _jsxs("span", { className: css.total, children: ["\u603B\u8BA1 ", formatUsd(totals.total)] })] }));
}
//# sourceMappingURL=PricingDock.js.map