import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * PricingSection: the "模型定价" settings page, styled after the Models
 * settings page. One card per provider route (catalog from `llm.models`),
 * each listing its models with a configured/unconfigured dot and an editor
 * for the three base rates plus the optional peak-hour rate set. Drafts live
 * in component state; 保存配置 writes the whole entries list through the
 * settings scope, and the scope refresh re-syncs the form with host truth.
 */
import { useEffect, useState } from 'react';
import { DEFAULT_PEAK_WINDOW } from "../settings.js";
import css from './PricingSection.module.css';
/** Draft entry for a route with no stored configuration yet. */
function defaultEntry(route) {
    return {
        provider: route.provider,
        model: route.model,
        inputMissPrice: 0,
        inputHitPrice: 0,
        outputPrice: 0,
        peakEnabled: false,
        peakWindows: [{ ...DEFAULT_PEAK_WINDOW }],
        peakTimeZone: 'local',
        peakInputMissPrice: 0,
        peakInputHitPrice: 0,
        peakOutputPrice: 0,
    };
}
/** Draft key: provider and model joined by a NUL (neither may contain it). */
function keyOf(provider, model) {
    return `${provider}\u0000${model}`;
}
function keyParts(key) {
    const [provider, model] = key.split('\u0000');
    return { provider: provider ?? '', model: model ?? '' };
}
function entriesOf(drafts) {
    const entries = [];
    for (const [key, entry] of drafts.entries()) {
        const parts = keyParts(key);
        entries.push({ ...entry, provider: parts.provider, model: parts.model });
    }
    return entries;
}
/**
 * One numeric price field. The input is a decimal-keyboard text field with
 * local string state, so intermediate typing ("0.") survives instead of being
 * re-serialized away by a controlled number input; only parses ≥ 0 commit to
 * the draft, and blur normalizes the text back to the committed value.
 */
function PriceField({ label, value, onCommit }) {
    const [text, setText] = useState(String(value));
    // Re-sync when the committed value changes from outside (draft seeding,
    // save re-sync, entry replacement).
    useEffect(() => { setText(String(value)); }, [value]);
    return (_jsxs("label", { className: css.field, children: [_jsx("span", { children: label }), _jsx("input", { type: "text", inputMode: "decimal", value: text, onChange: (event) => {
                    const raw = event.target.value;
                    setText(raw);
                    const parsed = Number(raw);
                    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 0)
                        onCommit(parsed);
                }, onBlur: () => { setText(String(value)); } })] }));
}
/**
 * Render the pricing settings page.
 * @param props - the injected face plus the bound scope hook.
 * @returns the section content.
 */
export function PricingSection({ usePricing, api, saveEntries }) {
    // The bound hook lies about nullability: the renderer returns undefined
    // while its source is absent, so the result is widened back before the guard.
    const pricing = usePricing(snapshot => snapshot);
    const [catalog, setCatalog] = useState(null);
    const [catalogError, setCatalogError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [drafts, setDrafts] = useState(null);
    const [editing, setEditing] = useState(null);
    const [status, setStatus] = useState('idle');
    useEffect(() => {
        let alive = true;
        api.llm.models({}).then((response) => {
            if (!alive)
                return;
            if (!response.result.ok) {
                setCatalogError(true);
                return;
            }
            setCatalog({
                groups: response.result.value.groups.map(group => ({
                    id: group.id,
                    name: group.name,
                    models: group.models.map(model => ({ id: model.id, name: model.name })),
                })),
                failures: response.result.value.failures,
            });
            setCatalogError(false);
        }).catch(() => {
            if (alive)
                setCatalogError(true);
        });
        return () => { alive = false; };
    }, [api, reloadKey]);
    // Seed drafts from the first ready pricing snapshot; the save handler
    // re-syncs afterwards, so external changes never wipe an open form.
    useEffect(() => {
        if (drafts !== null || pricing === undefined || pricing.status !== 'ready')
            return;
        const map = new Map();
        for (const entry of pricing.value?.entries ?? []) {
            map.set(keyOf(entry.provider, entry.model), { ...entry });
        }
        setDrafts(map);
    }, [drafts, pricing]);
    const patchDraft = (key, field, value) => {
        setDrafts((map) => {
            if (map === null)
                return map;
            const next = new Map(map);
            const current = next.get(key) ?? defaultEntry(keyParts(key));
            next.set(key, { ...current, [field]: value });
            return next;
        });
    };
    /** Apply one transformation to a draft's peak-window list. */
    const updateWindows = (key, update) => {
        setDrafts((map) => {
            if (map === null)
                return map;
            const next = new Map(map);
            const current = next.get(key) ?? defaultEntry(keyParts(key));
            next.set(key, { ...current, peakWindows: update(current.peakWindows) });
            return next;
        });
    };
    const removeDraft = (key) => {
        setDrafts((map) => {
            if (map === null)
                return map;
            const next = new Map(map);
            next.delete(key);
            return next;
        });
        setEditing(null);
    };
    const save = async () => {
        if (drafts === null)
            return;
        setStatus('saving');
        const submitted = entriesOf(drafts);
        const fresh = await saveEntries(submitted);
        // The post-write snapshot distinguishes a landed write (the form follows
        // host truth) from a rejected one (the values revert and the save fails).
        const landed = fresh.value !== undefined
            && fresh.value.entries.length === submitted.length
            && fresh.value.entries.every((entry, index) => entry.model === submitted[index]?.model && entry.provider === submitted[index]?.provider);
        setDrafts((map) => {
            if (map === null)
                return map;
            const next = new Map();
            for (const entry of fresh.value?.entries ?? [])
                next.set(keyOf(entry.provider, entry.model), { ...entry });
            return next;
        });
        setStatus(landed ? 'saved' : 'error');
    };
    if (catalog === null || catalogError) {
        return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.title, children: "\u6A21\u578B\u5B9A\u4EF7" }), _jsx("p", { className: css.intro, children: catalogError ? '模型目录加载失败。' : '加载中…' }), catalogError && (_jsx("button", { type: "button", className: css.secondaryButton, onClick: () => { setReloadKey(key => key + 1); }, children: "\u91CD\u8BD5" }))] }));
    }
    // Provider rows: catalog groups first, then providers present only in stored entries.
    const rows = [];
    const seenProviders = new Set();
    for (const group of catalog?.groups ?? []) {
        rows.push({ id: group.id, name: group.name, models: group.models });
        seenProviders.add(group.id);
    }
    for (const key of drafts?.keys() ?? []) {
        const { provider } = keyParts(key);
        if (seenProviders.has(provider))
            continue;
        seenProviders.add(provider);
        const models = [];
        for (const other of drafts?.keys() ?? []) {
            const parts = keyParts(other);
            if (parts.provider === provider)
                models.push({ id: parts.model, name: parts.model });
        }
        rows.push({ id: provider, name: provider, models, orphan: true });
    }
    const modelEntry = (providerId, modelId) => {
        return drafts?.get(keyOf(providerId, modelId));
    };
    const editorBody = (providerId, model) => {
        const key = keyOf(providerId, model.id);
        const entry = modelEntry(providerId, model.id) ?? defaultEntry({ provider: providerId, model: model.id });
        const textField = (field) => (event) => {
            patchDraft(key, field, event.target.value);
        };
        const priceField = (label, field) => (_jsx(PriceField, { label: label, value: entry[field], onCommit: (value) => { patchDraft(key, field, value); } }));
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.editorGrid, children: [priceField('输入（未命中）$/M', 'inputMissPrice'), priceField('输入（缓存命中）$/M', 'inputHitPrice'), priceField('输出 $/M', 'outputPrice')] }), _jsxs("label", { className: css.check, children: [_jsx("input", { type: "checkbox", checked: entry.peakEnabled, onChange: (event) => { patchDraft(key, 'peakEnabled', event.target.checked); } }), "\u542F\u7528\u9AD8\u5CF0\u671F\u5B9A\u4EF7\uFF08\u6309\u5F53\u524D\u65F6\u95F4\u9009\u62E9\u9AD8\u5CF0/\u975E\u9AD8\u5CF0\u4EF7\u683C\uFF09"] }), entry.peakEnabled && (_jsxs("div", { className: css.peakBlock, children: [entry.peakWindows.map((window, index) => (_jsxs("div", { className: css.windowRow, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { children: "\u9AD8\u5CF0\u5F00\u59CB\uFF08HH:MM\uFF09" }), _jsx("input", { type: "time", value: window.start, onChange: (event) => {
                                                updateWindows(key, (windows) => windows.map((item, at) => at === index ? { ...item, start: event.target.value } : item));
                                            } })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: "\u9AD8\u5CF0\u7ED3\u675F\uFF08HH:MM\uFF09" }), _jsx("input", { type: "time", value: window.end, onChange: (event) => {
                                                updateWindows(key, (windows) => windows.map((item, at) => at === index ? { ...item, end: event.target.value } : item));
                                            } })] }), _jsx("button", { type: "button", className: css.dangerButton, disabled: entry.peakWindows.length <= 1, onClick: () => {
                                        updateWindows(key, (windows) => windows.filter((_, at) => at !== index));
                                    }, children: "\u5220\u9664\u65F6\u6BB5" })] }, index))), _jsx("div", { children: _jsx("button", { type: "button", className: css.secondaryButton, onClick: () => {
                                    updateWindows(key, (windows) => [...windows, { ...DEFAULT_PEAK_WINDOW }]);
                                }, children: "\u6DFB\u52A0\u9AD8\u5CF0\u65F6\u6BB5" }) }), _jsxs("div", { className: css.editorGrid, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { children: "\u65F6\u533A" }), _jsxs("select", { value: entry.peakTimeZone, onChange: textField('peakTimeZone'), children: [_jsx("option", { value: "local", children: "\u672C\u5730\u65F6\u95F4" }), _jsx("option", { value: "utc", children: "UTC" })] })] }), priceField('高峰输入（未命中）$/M', 'peakInputMissPrice'), priceField('高峰输入（命中）$/M', 'peakInputHitPrice'), priceField('高峰输出 $/M', 'peakOutputPrice')] })] })), modelEntry(providerId, model.id) !== undefined && (_jsx("div", { className: css.editorActions, children: _jsx("button", { type: "button", className: css.dangerButton, onClick: () => { removeDraft(key); }, children: "\u6E05\u9664\u8BE5\u6A21\u578B\u7684\u4EF7\u683C\u914D\u7F6E" }) }))] }));
    };
    return (_jsxs("div", { className: css.section, children: [_jsx("h2", { className: css.title, children: "\u6A21\u578B\u5B9A\u4EF7" }), _jsx("p", { className: css.intro, children: "\u4E3A\u5404\u63D0\u4F9B\u65B9\u7684\u5404\u6A21\u578B\u914D\u7F6E\u6BCF\u767E\u4E07 token \u4EF7\u683C\uFF08\u7F8E\u5143\uFF09\u3002\u8F93\u5165\u4EF7\u683C\u5206\u4E3A\u7F13\u5B58\u672A\u547D\u4E2D\u4E0E\u7F13\u5B58\u547D\u4E2D\uFF1B\u7F13\u5B58\u5199\u5165\u6309\u672A\u547D\u4E2D\u4EF7\u8BA1\u8D39\u3002 \u542F\u7528\u9AD8\u5CF0\u5B9A\u4EF7\u540E\uFF0C\u53EF\u6DFB\u52A0\u591A\u4E2A\u9AD8\u5CF0\u65F6\u6BB5\uFF08\u9ED8\u8BA4\u4E3A\u4E00\u4E2A\uFF09\uFF0C\u5F53\u524D\u65F6\u95F4\u843D\u5165\u4EFB\u4E00\u65F6\u6BB5\u5373\u6309\u9AD8\u5CF0\u4EF7\u683C\u8BA1\u8D39\uFF1B\u65F6\u6BB5\u652F\u6301\u8DE8\u5348\u591C\uFF08\u5982 22:00\u201308:00\uFF09\u3002 \u672A\u914D\u7F6E\u4EF7\u683C\u7684\u6A21\u578B\u4E0D\u663E\u793A\u8D39\u7528\u3002" }), status === 'saved' && _jsx("p", { className: css.saved, role: "status", children: "\u5DF2\u4FDD\u5B58" }), rows.length === 0
                ? _jsx("p", { className: css.empty, children: "\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u63D0\u4F9B\u65B9\u6216\u6A21\u578B\u3002" })
                : (_jsx("ul", { className: css.rows, children: rows.map((row) => {
                        const models = [...row.models];
                        const seenModels = new Set(models.map(model => model.id));
                        for (const key of drafts?.keys() ?? []) {
                            const parts = keyParts(key);
                            if (parts.provider === row.id && !seenModels.has(parts.model)) {
                                models.push({ id: parts.model, name: parts.model });
                                seenModels.add(parts.model);
                            }
                        }
                        const configured = models.filter(model => modelEntry(row.id, model.id) !== undefined).length;
                        return (_jsxs("li", { className: css.rowCard, children: [_jsxs("div", { className: css.rowHead, children: [_jsxs("span", { className: css.rowIdentity, children: [_jsx("span", { className: css.rowName, children: row.name }), row.orphan === true && _jsx("span", { className: css.rowTag, children: "\u672A\u53D1\u73B0\u4E8E\u76EE\u5F55" }), _jsx("span", { className: css.rowTag, children: row.id })] }), _jsxs("span", { className: css.rowCount, children: [configured, "/", models.length, " \u5DF2\u914D\u7F6E"] })] }), _jsx("div", { className: css.modelList, children: models.map((model) => {
                                        const key = keyOf(row.id, model.id);
                                        const entry = modelEntry(row.id, model.id);
                                        const open = editing === key;
                                        return (_jsxs("div", { className: css.modelEntry, children: [_jsxs("div", { className: css.modelRow, children: [_jsx("span", { className: css.modelId, children: model.id }), model.name !== model.id && _jsx("span", { className: css.modelName, children: model.name }), _jsx("span", { className: entry === undefined ? css.dot : `${css.dot} ${css.dotOn}`, title: entry === undefined ? '未配置价格' : '已配置价格' }), _jsx("button", { type: "button", className: css.secondaryButton, onClick: () => { setEditing(open ? null : key); }, children: entry === undefined ? '配置' : '编辑' })] }), open && _jsx("div", { className: css.editor, children: editorBody(row.id, model) })] }, model.id));
                                    }) })] }, row.id));
                    }) })), (catalog?.failures.length ?? 0) > 0 && (_jsxs("p", { className: css.empty, children: ["\u4EE5\u4E0B\u63D0\u4F9B\u65B9\u7684\u6A21\u578B\u76EE\u5F55\u52A0\u8F7D\u5931\u8D25\uFF1A", catalog?.failures.map(failure => `${failure.name}（${failure.message}）`).join('；')] })), _jsxs("div", { className: css.actions, children: [_jsx("button", { type: "button", className: css.primaryButton, onClick: () => { void save(); }, disabled: status === 'saving' || drafts === null, children: status === 'saving' ? '保存中…' : '保存配置' }), status === 'saving' && _jsx("span", { className: css.status, children: "\u4FDD\u5B58\u4E2D\u2026" }), status === 'error' && _jsx("span", { className: `${css.status} ${css.statusError}`, children: "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" })] })] }));
}
//# sourceMappingURL=PricingSection.js.map