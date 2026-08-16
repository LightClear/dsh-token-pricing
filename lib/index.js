import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { z } from "zod";
import z$1 from "@deepseek-ai/schemastery";
//#region lib/types/projection.js
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
const stepSchema = z.object({
	step: z.number().int().nonnegative(),
	provider: z.string(),
	model: z.string(),
	time: z.number().int().nonnegative(),
	inputTokens: z.number().int().nonnegative(),
	cacheReadTokens: z.number().int().nonnegative(),
	cacheWriteTokens: z.number().int().nonnegative(),
	outputTokens: z.number().int().nonnegative()
}).strict();
const turnSchema = z.object({
	turn: z.number().int().nonnegative(),
	startTime: z.number().int().nonnegative(),
	steps: z.array(stepSchema)
}).strict();
const projectionSchema = z.object({ turns: z.array(turnSchema) }).strict();
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
	if (usage === void 0) return null;
	return {
		step: event.data.step,
		provider: "",
		model: "",
		time: event.time,
		inputTokens: usage.inputTokens,
		cacheReadTokens: usage.cacheReadTokens ?? 0,
		cacheWriteTokens: usage.cacheWriteTokens ?? 0,
		outputTokens: usage.outputTokens
	};
}
/**
* The per-turn pricing projection. State stays plain JSON per the unit
* contract; `view` publishes only the turns, so the fold's route and
* duplicate-guard slots never reach the wire.
*/
const tokenPricingProjectionDefinition = {
	key: "tokenPricing",
	schema: projectionSchema,
	init: () => ({
		turns: [],
		last: null,
		route: {
			provider: "",
			model: ""
		}
	}),
	apply: (state, event) => {
		switch (event.type) {
			case "request/header": {
				const { provider, model } = event.data.header.config;
				if (state.route.provider === provider && state.route.model === model) return state;
				return {
					...state,
					route: {
						provider,
						model
					}
				};
			}
			case "turn/start": {
				const last = state.turns.at(-1);
				if (last !== void 0 && last.turn === event.data.turn) return state;
				return {
					...state,
					turns: [...state.turns, {
						turn: event.data.turn,
						startTime: event.time,
						steps: []
					}]
				};
			}
			case "assistant/message": {
				if (state.last !== null && state.last.turn === event.data.turn && state.last.step === event.data.step) return state;
				const usage = usageStep(event);
				if (usage === null) return state;
				const step = {
					...usage,
					provider: state.route.provider,
					model: state.route.model
				};
				const last = state.turns.at(-1);
				const turns = last !== void 0 && last.turn === event.data.turn ? [...state.turns.slice(0, -1), {
					...last,
					steps: [...last.steps, step]
				}] : [...state.turns, {
					turn: event.data.turn,
					startTime: event.time,
					steps: [step]
				}];
				return {
					...state,
					turns,
					last: {
						turn: event.data.turn,
						step: event.data.step
					}
				};
			}
			default: return state;
		}
	},
	view: (state) => ({ turns: state.turns }),
	stateVersion: 1
};
//#endregion
//#region lib/types/settings.js
/**
* Durable token-pricing section: per-provider/model USD rates per million
* tokens, with an optional peak rate set over any number of time windows.
* Shared by the Host schema (the `settings.register` wire envelope) and the
* browser scope (the settingsScope value), so this module must stay
* browser-safe.
* @module @deepseek-ai/dsh-client-token-pricing/settings
*/
/** Settings namespace owned by the token-pricing plugin. */
const TOKEN_PRICING_NAMESPACE = "token-pricing";
/** Accepted peak-window timezone bases. */
const PEAK_TIME_ZONES = ["local", "utc"];
/** The single default peak window a freshly enabled entry starts from. */
const DEFAULT_PEAK_WINDOW = {
	start: "09:00",
	end: "18:00"
};
/**
* Schema for one provider/model rate entry. A schemastery transform folds
* legacy single-window entries (`peakStart`/`peakEnd`) into `peakWindows`,
* so stored configurations survive the schema change: a legacy entry keeps
* its window, and an entry already carrying `peakWindows` passes through
* unchanged (the transform also drops the legacy keys, so the first save
* writes the new shape). The callback is deliberately self-contained — the
* settings wire serializes it to the browser, where it is rehydrated with
* no access to this module's bindings.
*/
const TokenPricingEntrySchema = z$1.transform(z$1.object({
	provider: z$1.string().default(""),
	model: z$1.string().default(""),
	inputMissPrice: z$1.number().min(0).default(0),
	inputHitPrice: z$1.number().min(0).default(0),
	outputPrice: z$1.number().min(0).default(0),
	peakEnabled: z$1.boolean().default(false),
	peakWindows: z$1.array(z$1.object({
		start: z$1.string().default("09:00"),
		end: z$1.string().default("18:00")
	})),
	peakTimeZone: z$1.union([...PEAK_TIME_ZONES]).default("local"),
	peakInputMissPrice: z$1.number().min(0).default(0),
	peakInputHitPrice: z$1.number().min(0).default(0),
	peakOutputPrice: z$1.number().min(0).default(0),
	peakStart: z$1.string(),
	peakEnd: z$1.string()
}), (entry) => {
	const configured = entry.peakWindows ?? [];
	const windows = configured.length > 0 ? configured : entry.peakStart != null ? [{
		start: entry.peakStart,
		end: entry.peakEnd ?? "18:00"
	}] : [{
		start: "09:00",
		end: "18:00"
	}];
	return {
		provider: entry.provider,
		model: entry.model,
		inputMissPrice: entry.inputMissPrice,
		inputHitPrice: entry.inputHitPrice,
		outputPrice: entry.outputPrice,
		peakEnabled: entry.peakEnabled,
		peakWindows: windows,
		peakTimeZone: entry.peakTimeZone,
		peakInputMissPrice: entry.peakInputMissPrice,
		peakInputHitPrice: entry.peakInputHitPrice,
		peakOutputPrice: entry.peakOutputPrice
	};
});
/** Durable section schema; also the wire envelope the browser scope validates against. */
const TokenPricingSchema = z$1.object({ entries: z$1.array(TokenPricingEntrySchema).default([]) });
//#endregion
//#region lib/types/index.js
/**
* Host registration for the token-pricing domain: the durable settings
* section (the browser-owned per-model rates) and the `tokenPricing` session
* projection (whole-log per-turn provider usage under each step's dispatch
* route). The settings service is the package's purpose and a hard
* dependency; the projection registry is an optional child, so assemblies
* without it keep the settings surface and lose only the per-turn readout.
* @module @deepseek-ai/dsh-client-token-pricing
*/
/** Required services: the durable settings registry owns the rates section. */
const inject = ["settings"];
/**
* Register the durable token-pricing section, then the per-turn usage
* projection unit where the projection registry exists.
* @param ctx - Host context carrying the settings service.
*/
function apply(ctx) {
	ctx.settings.register(settingsNamespace(TOKEN_PRICING_NAMESPACE), TokenPricingSchema, { remote: true });
	ctx.inject(["sessionProjections"], (projectionCtx) => {
		projectionCtx.sessionProjections.register(tokenPricingProjectionDefinition);
	});
}
//#endregion
export { DEFAULT_PEAK_WINDOW, PEAK_TIME_ZONES, TOKEN_PRICING_NAMESPACE, apply, inject };
