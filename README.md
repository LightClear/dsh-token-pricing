# dsh-client-token-pricing

English | [中文](README.zh.md)

Per-provider/model token pricing for the web surface: a durable `token-pricing` settings section (USD per 1M tokens for uncached input, cache-hit input, and output, plus an optional peak-hour window with its own rate set) and a conversation cost readout in the `conversation.composer.dock` band beside the shipped stats line. The node half only registers the settings namespace; everything else rides existing host services.

The readout shows `模型 · 输入 $X · 输出 $Y · 总计 $Z` for the session's cumulative `tokenUsage` projection under the matched entry for the session's current provider/model route (`session.models`). A route with no configured entry — or no usage yet — renders nothing. When peak pricing is enabled, the current tier (`高峰价` / `非高峰价`) follows the current time in the configured timezone and refreshes once a minute; the hover tooltip breaks the totals down by uncached/cache-hit tokens and rates.

The settings page ("模型定价") follows the Models settings page layout: one card per provider route from the `llm.models` catalog, each listing its models with a configured/unconfigured dot and an editor for the three base rates plus the peak-hour rate set. Stored entries whose provider is absent from the catalog still render (tagged 未发现于目录) so they stay editable. 保存配置 writes the whole entries list through the settings scope (`settingsScope`), whose recovery read re-syncs the form with host truth; a rejected write surfaces as a save failure.

The `/client` exports are the plugin body (`apply`/`inject`), the dock and section components, and their injected face types. Pure cost math lives in `src/client/pricing.ts`.

## Model Experience

None: the plugin adds no prompt content, registers no model-visible tools, and reads no settings into the request path. The readout is a presentation of existing durable data (the `tokenUsage` projection and the `session.models` route), so it never changes what a model sees.

#### KV Cache effect

None. The plugin only reads the `tokenUsage` projection after requests commit; it does not influence request composition, cache reuse, or compaction.

## Known Limitations and Deferred Work

- **Whole-session totals at current rates** — the readout prices the session's cumulative token usage with the currently matched entry and the current time. Usage generated under an earlier model or an earlier rate set is not re-billed per request, so the figure is an estimate under today's rates, not a per-request ledger.
- **Peak tier is display-time only** — the tier is chosen at render time; the accumulated totals are not re-split retroactively when the time crosses a peak boundary.
