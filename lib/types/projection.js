/**
 * The `tokenPricing` session projection unit: a pure fold of turn boundaries,
 * request headers, and assembled assistant messages into per-turn provider
 * usage facts under each step's dispatch route.
 *
 * The fold records usage only — no pricing entries and no USD. Rates live in
 * the settings scope, so the browser prices the projection at render time
 * and a retroactive entry edit reprises every historical step. Route
 * attribution replays `request/header` (appended before dispatch, on
 * change): the latest header's `config.provider`/`config.model` is exactly
 * the route the next `assistant/message` dispatched under. A legal log holds
 * one assembled message per step (`llm-retry` re-dispatches a failed stream
 * inside the same step without appending a second message), so a duplicate
 * guard matches the session-stats fold's defensive shape. Usage-absent
 * messages (adapters that report none) and compaction summaries (no usage
 * event at all) simply leave no step — the same coverage as the `tokenUsage`
 * meter.
 * @module @deepseek-ai/dsh-client-token-pricing/projection
 */
import { z } from 'zod';
const stepSchema = z.object({
    step: z.number().int().nonnegative(),
    provider: z.string(),
    model: z.string(),
    time: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheWriteTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
}).strict();
const turnSchema = z.object({
    turn: z.number().int().nonnegative(),
    startTime: z.number().int().nonnegative(),
    steps: z.array(stepSchema),
}).strict();
const projectionSchema = z.object({
    turns: z.array(turnSchema),
}).strict();
/**
 * One usage-bearing message as a route-less step record (the fold stamps the
 * dispatch route in). Returns null when the adapter reported no usage, so
 * such messages leave no step. The typed session boundary and the append-time
 * `isJsonValue` check already guarantee finite numbers, matching the
 * token-meter fold's trust level.
 * @param event - the assembled message event.
 * @returns the usage step without its route, or null without a usage record.
 */
function usageStep(event) {
    const usage = event.data.usage;
    if (usage === undefined)
        return null;
    return {
        step: event.data.step,
        provider: '',
        model: '',
        time: event.time,
        inputTokens: usage.inputTokens,
        cacheReadTokens: usage.cacheReadTokens ?? 0,
        cacheWriteTokens: usage.cacheWriteTokens ?? 0,
        outputTokens: usage.outputTokens,
    };
}
/**
 * The per-turn pricing projection. State stays plain JSON per the unit
 * contract; `view` publishes only the turns, so the fold's route and
 * duplicate-guard slots never reach the wire.
 */
export const tokenPricingProjectionDefinition = {
    key: 'tokenPricing',
    schema: projectionSchema,
    init: () => ({ turns: [], last: null, route: { provider: '', model: '' } }),
    apply: (state, event) => {
        switch (event.type) {
            case 'request/header': {
                const { provider, model } = event.data.header.config;
                if (state.route.provider === provider && state.route.model === model)
                    return state;
                return { ...state, route: { provider, model } };
            }
            case 'turn/start': {
                const last = state.turns.at(-1);
                // Defensive: a duplicate turn/start must not open a second row.
                if (last !== undefined && last.turn === event.data.turn)
                    return state;
                return { ...state, turns: [...state.turns, { turn: event.data.turn, startTime: event.time, steps: [] }] };
            }
            case 'assistant/message': {
                if (state.last !== null
                    && state.last.turn === event.data.turn
                    && state.last.step === event.data.step)
                    return state;
                const usage = usageStep(event);
                if (usage === null)
                    return state;
                const step = { ...usage, provider: state.route.provider, model: state.route.model };
                const last = state.turns.at(-1);
                const turns = last !== undefined && last.turn === event.data.turn
                    ? [...state.turns.slice(0, -1), { ...last, steps: [...last.steps, step] }]
                    // Defensive: a message outside the last opened turn opens its row
                    // here, stamped with the message time.
                    : [...state.turns, { turn: event.data.turn, startTime: event.time, steps: [step] }];
                return { ...state, turns, last: { turn: event.data.turn, step: event.data.step } };
            }
            default:
                return state;
        }
    },
    view: state => ({ turns: state.turns }),
    stateVersion: 1,
};
//# sourceMappingURL=projection.js.map