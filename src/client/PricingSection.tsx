/**
 * PricingSection: the "模型定价" settings page, styled after the Models
 * settings page. One card per provider route (catalog from `llm.models`),
 * each listing its models with a configured/unconfigured dot and an editor
 * for the three base rates plus the optional peak-hour rate set. Drafts live
 * in component state; 保存配置 writes the whole entries list through the
 * settings scope, and the scope refresh re-syncs the form with host truth.
 */

import { useEffect, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { PeakWindow, TokenPricingEntry, TokenPricingSettings } from '../settings.ts'
import { DEFAULT_PEAK_WINDOW } from '../settings.ts'
import css from './PricingSection.module.css'

/** Draft entry for a route with no stored configuration yet. */
function defaultEntry(route: { provider: string; model: string }): TokenPricingEntry {
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
  }
}

/** One catalog provider group with its models. */
export interface CatalogGroup {
  id: string
  name: string
  models: { id: string; name: string }[]
}

/** One failed provider catalog listing. */
export interface CatalogFailure {
  id: string
  name: string
  message: string
}

/** Injected business face of the section entry; the hooks compartment binds the pricing scope as `usePricing`. */
export interface PricingSectionInjected {
  hooks: {
    /** The durable pricing section, refreshed on every settings update. */
    pricing: SettingsScope<TokenPricingSettings>
  }
  /** Wire faces for the host-scoped model catalog RPC. */
  api: IApiClient
  /**
   * Persist the whole entries list through the settings scope and return the
   * post-write snapshot (the write's recovery read refreshes it), so the form
   * can tell a landed write from a rejected one.
   */
  saveEntries: (entries: TokenPricingEntry[]) => Promise<SettingsScopeSnapshot<TokenPricingSettings>>
}

/** Composed props: the injected face plus the bound pricing scope hook. */
export type PricingSectionProps = {
  usePricing: SnapshotSelectorHook<SettingsScopeSnapshot<TokenPricingSettings>>
  api: IApiClient
  saveEntries: (entries: TokenPricingEntry[]) => Promise<SettingsScopeSnapshot<TokenPricingSettings>>
}

/** Draft key: provider and model joined by a NUL (neither may contain it). */
function keyOf(provider: string, model: string): string {
  return `${provider}\u0000${model}`
}

function keyParts(key: string): { provider: string; model: string } {
  const [provider, model] = key.split('\u0000')
  return { provider: provider ?? '', model: model ?? '' }
}

function entriesOf(drafts: ReadonlyMap<string, TokenPricingEntry>): TokenPricingEntry[] {
  const entries: TokenPricingEntry[] = []
  for (const [key, entry] of drafts.entries()) {
    const parts = keyParts(key)
    entries.push({ ...entry, provider: parts.provider, model: parts.model })
  }
  return entries
}

/**
 * One numeric price field. The input is a decimal-keyboard text field with
 * local string state, so intermediate typing ("0.") survives instead of being
 * re-serialized away by a controlled number input; only parses ≥ 0 commit to
 * the draft, and blur normalizes the text back to the committed value.
 */
function PriceField({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  const [text, setText] = useState(String(value))
  // Re-sync when the committed value changes from outside (draft seeding,
  // save re-sync, entry replacement).
  useEffect(() => { setText(String(value)) }, [value])
  return (
    <label className={css.field}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const raw = event.target.value
          setText(raw)
          const parsed = Number(raw)
          if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= 0) onCommit(parsed)
        }}
        onBlur={() => { setText(String(value)) }}
      />
    </label>
  )
}

/**
 * Render the pricing settings page.
 * @param props - the injected face plus the bound scope hook.
 * @returns the section content.
 */
export function PricingSection({ usePricing, api, saveEntries }: PricingSectionProps) {
  // The bound hook lies about nullability: the renderer returns undefined
  // while its source is absent, so the result is widened back before the guard.
  const pricing = usePricing(snapshot => snapshot) as SettingsScopeSnapshot<TokenPricingSettings> | undefined
  const [catalog, setCatalog] = useState<{ groups: CatalogGroup[]; failures: CatalogFailure[] } | null>(null)
  const [catalogError, setCatalogError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [drafts, setDrafts] = useState<Map<string, TokenPricingEntry> | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'error' | 'idle'>('idle')

  useEffect(() => {
    let alive = true
    api.llm.models({}).then((response) => {
      if (!alive) return
      if (!response.result.ok) {
        setCatalogError(true)
        return
      }
      setCatalog({
        groups: response.result.value.groups.map(group => ({
          id: group.id,
          name: group.name,
          models: group.models.map(model => ({ id: model.id, name: model.name })),
        })),
        failures: response.result.value.failures,
      })
      setCatalogError(false)
    }).catch(() => {
      if (alive) setCatalogError(true)
    })
    return () => { alive = false }
  }, [api, reloadKey])

  // Seed drafts from the first ready pricing snapshot; the save handler
  // re-syncs afterwards, so external changes never wipe an open form.
  useEffect(() => {
    if (drafts !== null || pricing === undefined || pricing.status !== 'ready') return
    const map = new Map<string, TokenPricingEntry>()
    for (const entry of pricing.value?.entries ?? []) {
      map.set(keyOf(entry.provider, entry.model), { ...entry })
    }
    setDrafts(map)
  }, [drafts, pricing])

  const patchDraft = (key: string, field: keyof TokenPricingEntry, value: unknown): void => {
    setDrafts((map) => {
      if (map === null) return map
      const next = new Map(map)
      const current = next.get(key) ?? defaultEntry(keyParts(key))
      next.set(key, { ...current, [field]: value })
      return next
    })
  }

  /** Apply one transformation to a draft's peak-window list. */
  const updateWindows = (key: string, update: (windows: PeakWindow[]) => PeakWindow[]): void => {
    setDrafts((map) => {
      if (map === null) return map
      const next = new Map(map)
      const current = next.get(key) ?? defaultEntry(keyParts(key))
      next.set(key, { ...current, peakWindows: update(current.peakWindows) })
      return next
    })
  }

  const removeDraft = (key: string): void => {
    setDrafts((map) => {
      if (map === null) return map
      const next = new Map(map)
      next.delete(key)
      return next
    })
    setEditing(null)
  }

  const save = async (): Promise<void> => {
    if (drafts === null) return
    setStatus('saving')
    const submitted = entriesOf(drafts)
    const fresh = await saveEntries(submitted)
    // The post-write snapshot distinguishes a landed write (the form follows
    // host truth) from a rejected one (the values revert and the save fails).
    const landed = fresh.value !== undefined
      && fresh.value.entries.length === submitted.length
      && fresh.value.entries.every((entry, index) =>
        entry.model === submitted[index]?.model && entry.provider === submitted[index]?.provider)
    setDrafts((map) => {
      if (map === null) return map
      const next = new Map<string, TokenPricingEntry>()
      for (const entry of fresh.value?.entries ?? []) next.set(keyOf(entry.provider, entry.model), { ...entry })
      return next
    })
    setStatus(landed ? 'saved' : 'error')
  }

  if (catalog === null || catalogError) {
    return (
      <div className={css.section}>
        <h2 className={css.title}>模型定价</h2>
        <p className={css.intro}>{catalogError ? '模型目录加载失败。' : '加载中…'}</p>
        {catalogError && (
          <button
            type="button"
            className={css.secondaryButton}
            onClick={() => { setReloadKey(key => key + 1) }}
          >
            重试
          </button>
        )}
      </div>
    )
  }

  // Provider rows: catalog groups first, then providers present only in stored entries.
  const rows: { id: string; name: string; models: { id: string; name: string }[]; orphan?: boolean }[] = []
  const seenProviders = new Set<string>()
  for (const group of catalog?.groups ?? []) {
    rows.push({ id: group.id, name: group.name, models: group.models })
    seenProviders.add(group.id)
  }
  for (const key of drafts?.keys() ?? []) {
    const { provider } = keyParts(key)
    if (seenProviders.has(provider)) continue
    seenProviders.add(provider)
    const models: { id: string; name: string }[] = []
    for (const other of drafts?.keys() ?? []) {
      const parts = keyParts(other)
      if (parts.provider === provider) models.push({ id: parts.model, name: parts.model })
    }
    rows.push({ id: provider, name: provider, models, orphan: true })
  }

  const modelEntry = (providerId: string, modelId: string): TokenPricingEntry | undefined => {
    return drafts?.get(keyOf(providerId, modelId))
  }

  const editorBody = (providerId: string, model: { id: string; name: string }): ReactNode => {
    const key = keyOf(providerId, model.id)
    const entry = modelEntry(providerId, model.id) ?? defaultEntry({ provider: providerId, model: model.id })
    const textField = (field: keyof TokenPricingEntry) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      patchDraft(key, field, event.target.value)
    }
    const priceField = (label: string, field: keyof TokenPricingEntry) => (
      <PriceField
        label={label}
        value={entry[field] as number}
        onCommit={(value) => { patchDraft(key, field, value) }}
      />
    )
    return (
      <>
        <div className={css.editorGrid}>
          {priceField('输入（未命中）$/M', 'inputMissPrice')}
          {priceField('输入（缓存命中）$/M', 'inputHitPrice')}
          {priceField('输出 $/M', 'outputPrice')}
        </div>
        <label className={css.check}>
          <input
            type="checkbox"
            checked={entry.peakEnabled}
            onChange={(event) => { patchDraft(key, 'peakEnabled', event.target.checked) }}
          />
          启用高峰期定价（按当前时间选择高峰/非高峰价格）
        </label>
        {entry.peakEnabled && (
          <div className={css.peakBlock}>
            {entry.peakWindows.map((window, index) => (
              <div key={index} className={css.windowRow}>
                <label className={css.field}>
                  <span>高峰开始（HH:MM）</span>
                  <input
                    type="time"
                    value={window.start}
                    onChange={(event) => {
                      updateWindows(key, (windows) => windows.map((item, at) =>
                        at === index ? { ...item, start: event.target.value } : item))
                    }}
                  />
                </label>
                <label className={css.field}>
                  <span>高峰结束（HH:MM）</span>
                  <input
                    type="time"
                    value={window.end}
                    onChange={(event) => {
                      updateWindows(key, (windows) => windows.map((item, at) =>
                        at === index ? { ...item, end: event.target.value } : item))
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={css.dangerButton}
                  disabled={entry.peakWindows.length <= 1}
                  onClick={() => {
                    updateWindows(key, (windows) => windows.filter((_, at) => at !== index))
                  }}
                >
                  删除时段
                </button>
              </div>
            ))}
            <div>
              <button
                type="button"
                className={css.secondaryButton}
                onClick={() => {
                  updateWindows(key, (windows) => [...windows, { ...DEFAULT_PEAK_WINDOW }])
                }}
              >
                添加高峰时段
              </button>
            </div>
            <div className={css.editorGrid}>
              <label className={css.field}>
                <span>时区</span>
                <select value={entry.peakTimeZone} onChange={textField('peakTimeZone')}>
                  <option value="local">本地时间</option>
                  <option value="utc">UTC</option>
                </select>
              </label>
              {priceField('高峰输入（未命中）$/M', 'peakInputMissPrice')}
              {priceField('高峰输入（命中）$/M', 'peakInputHitPrice')}
              {priceField('高峰输出 $/M', 'peakOutputPrice')}
            </div>
          </div>
        )}
        {modelEntry(providerId, model.id) !== undefined && (
          <div className={css.editorActions}>
            <button
              type="button"
              className={css.dangerButton}
              onClick={() => { removeDraft(key) }}
            >
              清除该模型的价格配置
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className={css.section}>
      <h2 className={css.title}>模型定价</h2>
      <p className={css.intro}>
        为各提供方的各模型配置每百万 token 价格（美元）。输入价格分为缓存未命中与缓存命中；缓存写入按未命中价计费。
        启用高峰定价后，可添加多个高峰时段（默认为一个），当前时间落入任一时段即按高峰价格计费；时段支持跨午夜（如 22:00–08:00）。
        未配置价格的模型不显示费用。
      </p>
      {status === 'saved' && <p className={css.saved} role="status">已保存</p>}
      {rows.length === 0
        ? <p className={css.empty}>当前没有可用的提供方或模型。</p>
        : (
          <ul className={css.rows}>
            {rows.map((row) => {
              const models = [...row.models]
              const seenModels = new Set(models.map(model => model.id))
              for (const key of drafts?.keys() ?? []) {
                const parts = keyParts(key)
                if (parts.provider === row.id && !seenModels.has(parts.model)) {
                  models.push({ id: parts.model, name: parts.model })
                  seenModels.add(parts.model)
                }
              }
              const configured = models.filter(model => modelEntry(row.id, model.id) !== undefined).length
              return (
                <li key={row.id} className={css.rowCard}>
                  <div className={css.rowHead}>
                    <span className={css.rowIdentity}>
                      <span className={css.rowName}>{row.name}</span>
                      {row.orphan === true && <span className={css.rowTag}>未发现于目录</span>}
                      <span className={css.rowTag}>{row.id}</span>
                    </span>
                    <span className={css.rowCount}>{configured}/{models.length} 已配置</span>
                  </div>
                  <div className={css.modelList}>
                    {models.map((model) => {
                      const key = keyOf(row.id, model.id)
                      const entry = modelEntry(row.id, model.id)
                      const open = editing === key
                      return (
                        <div key={model.id} className={css.modelEntry}>
                          <div className={css.modelRow}>
                            <span className={css.modelId}>{model.id}</span>
                            {model.name !== model.id && <span className={css.modelName}>{model.name}</span>}
                            <span
                              className={entry === undefined ? css.dot : `${css.dot} ${css.dotOn}`}
                              title={entry === undefined ? '未配置价格' : '已配置价格'}
                            />
                            <button
                              type="button"
                              className={css.secondaryButton}
                              onClick={() => { setEditing(open ? null : key) }}
                            >
                              {entry === undefined ? '配置' : '编辑'}
                            </button>
                          </div>
                          {open && <div className={css.editor}>{editorBody(row.id, model)}</div>}
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      {(catalog?.failures.length ?? 0) > 0 && (
        <p className={css.empty}>
          以下提供方的模型目录加载失败：
          {catalog?.failures.map(failure => `${failure.name}（${failure.message}）`).join('；')}
        </p>
      )}
      <div className={css.actions}>
        <button
          type="button"
          className={css.primaryButton}
          onClick={() => { void save() }}
          disabled={status === 'saving' || drafts === null}
        >
          {status === 'saving' ? '保存中…' : '保存配置'}
        </button>
        {status === 'saving' && <span className={css.status}>保存中…</span>}
        {status === 'error' && <span className={`${css.status} ${css.statusError}`}>保存失败，请重试</span>}
      </div>
    </div>
  )
}
