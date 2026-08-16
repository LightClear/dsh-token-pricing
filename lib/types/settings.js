/**
 * Durable token-pricing section: per-provider/model USD rates per million
 * tokens, with an optional peak rate set over any number of time windows.
 * Shared by the Host schema (the `settings.register` wire envelope) and the
 * browser scope (the settingsScope value), so this module must stay
 * browser-safe.
 * @module @deepseek-ai/dsh-client-token-pricing/settings
 */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the token-pricing plugin. */
export const TOKEN_PRICING_NAMESPACE = 'token-pricing';
/** Accepted peak-window timezone bases. */
export const PEAK_TIME_ZONES = ['local', 'utc'];
/** The single default peak window a freshly enabled entry starts from. */
export const DEFAULT_PEAK_WINDOW = { start: '09:00', end: '18:00' };
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
export const TokenPricingEntrySchema = z.transform(z.object({
    provider: z.string().default(''),
    model: z.string().default(''),
    inputMissPrice: z.number().min(0).default(0),
    inputHitPrice: z.number().min(0).default(0),
    outputPrice: z.number().min(0).default(0),
    peakEnabled: z.boolean().default(false),
    peakWindows: z.array(z.object({
        start: z.string().default('09:00'),
        end: z.string().default('18:00'),
    })),
    peakTimeZone: z.union([...PEAK_TIME_ZONES]).default('local'),
    peakInputMissPrice: z.number().min(0).default(0),
    peakInputHitPrice: z.number().min(0).default(0),
    peakOutputPrice: z.number().min(0).default(0),
    // Legacy single-window fields; the transform folds them into peakWindows.
    peakStart: z.string(),
    peakEnd: z.string(),
}), (entry) => {
    // The inner array schema defaults an absent peakWindows to [], so a legacy
    // entry (no window list, single-window fields present) is the empty-list
    // case with peakStart set. Legacy fields win there; an empty list without
    // them (a partial hand-edit) falls back to the default window.
    const configured = entry.peakWindows ?? [];
    const windows = configured.length > 0
        ? configured
        : entry.peakStart != null
            ? [{ start: entry.peakStart, end: entry.peakEnd ?? '18:00' }]
            : [{ start: '09:00', end: '18:00' }];
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
        peakOutputPrice: entry.peakOutputPrice,
    };
});
/** Durable section schema; also the wire envelope the browser scope validates against. */
export const TokenPricingSchema = z.object({
    entries: z.array(TokenPricingEntrySchema).default([]),
});
//# sourceMappingURL=settings.js.map