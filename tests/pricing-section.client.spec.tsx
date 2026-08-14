// @vitest-environment jsdom
/**
 * PricingSection render behavior: catalog rows, per-model editors, peak
 * fields, save/remove flows, and failure states. The component reads nothing
 * but its props, so every interaction is driven through stubs.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PricingSection } from '../src/client/PricingSection.tsx'
import type { PricingSectionProps } from '../src/client/PricingSection.tsx'
import type { SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { TokenPricingEntry, TokenPricingSettings } from '../src/settings.ts'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const ENTRY: TokenPricingEntry = {
  provider: 'deepseek-official',
  model: 'deepseek-chat',
  inputMissPrice: 0.28,
  inputHitPrice: 0.07,
  outputPrice: 0.42,
  peakEnabled: false,
  peakStart: '09:00',
  peakEnd: '18:00',
  peakTimeZone: 'local',
  peakInputMissPrice: 0,
  peakInputHitPrice: 0,
  peakOutputPrice: 0,
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

function catalogApi(groups: unknown[] = [{ id: 'deepseek-official', name: 'DeepSeek', models: [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }] }], failures: unknown[] = []) {
  return {
    llm: { models: async () => ({
      rpcId: 'r' as never,
      result: { ok: true, value: { groups, failures } },
    }) },
  }
}

/** A saveEntries stub that echoes the submitted entries back as the post-write snapshot. */
function echoSave() {
  return vi.fn(async (entries: TokenPricingEntry[]) => snapshot({ value: { entries } }))
}

function props(overrides: Partial<PricingSectionProps> = {}): PricingSectionProps {
  return {
    usePricing: (() => snapshot()) as unknown as PricingSectionProps['usePricing'],
    api: catalogApi() as unknown as PricingSectionProps['api'],
    saveEntries: echoSave(),
    ...overrides,
  }
}

describe('PricingSection', () => {
  it('renders a provider card with its models and the configured count', async () => {
    render(<PricingSection {...props()} />)
    expect(await screen.findByText('DeepSeek')).toBeTruthy()
    expect(screen.getByText('deepseek-official')).toBeTruthy()
    expect(screen.getByText('1/1 已配置')).toBeTruthy()
    expect(screen.getByText('编辑')).toBeTruthy()
  })

  it('opens the editor and persists edits through saveEntries', async () => {
    const saveEntries = echoSave()
    render(<PricingSection {...props({ saveEntries })} />)
    fireEvent.click(await screen.findByText('编辑'))
    fireEvent.change(screen.getByLabelText('输入（未命中）$/M'), { target: { value: '0.5' } })
    fireEvent.click(screen.getByText('保存配置'))
    await waitFor(() => { expect(saveEntries).toHaveBeenCalled() })
    const submitted = saveEntries.mock.calls[0]![0] as TokenPricingEntry[]
    expect(submitted[0]?.inputMissPrice).toBe(0.5)
    expect(submitted[0]?.model).toBe('deepseek-chat')
    expect(submitted[0]?.provider).toBe('deepseek-official')
    expect(await screen.findByText('已保存')).toBeTruthy()
  })

  it('reveals and fills the peak rate set when peak pricing is enabled', async () => {
    const saveEntries = echoSave()
    render(<PricingSection {...props({ saveEntries })} />)
    fireEvent.click(await screen.findByText('编辑'))
    fireEvent.click(screen.getByText('启用高峰期定价（按当前时间选择高峰/非高峰价格）'))
    expect(screen.getByLabelText('高峰输入（未命中）$/M')).toBeTruthy()
    expect(screen.getByLabelText('高峰开始（HH:MM）')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('高峰输入（未命中）$/M'), { target: { value: '0.14' } })
    fireEvent.click(screen.getByText('保存配置'))
    await waitFor(() => {
      const submitted = saveEntries.mock.calls[0]![0] as TokenPricingEntry[]
      expect(submitted[0]?.peakInputMissPrice).toBe(0.14)
      expect(submitted[0]?.peakEnabled).toBe(true)
    })
  })

  it('reports a rejected write as a save failure', async () => {
    const saveEntries = vi.fn(async () => snapshot({ value: { entries: [] } }))
    render(<PricingSection {...props({ saveEntries })} />)
    fireEvent.click(await screen.findByText('编辑'))
    fireEvent.click(screen.getByText('保存配置'))
    expect(await screen.findByText('保存失败，请重试')).toBeTruthy()
  })

  it('clears an existing entry through the editor action', async () => {
    const saveEntries = echoSave()
    render(<PricingSection {...props({ saveEntries })} />)
    fireEvent.click(await screen.findByText('编辑'))
    fireEvent.click(screen.getByText('清除该模型的价格配置'))
    expect(screen.getByText('配置')).toBeTruthy()
    fireEvent.click(screen.getByText('保存配置'))
    await waitFor(() => {
      const submitted = saveEntries.mock.calls[0]![0] as unknown[]
      expect(submitted).toHaveLength(0)
    })
  })

  it('shows the loading state before the catalog lands', async () => {
    const never = new Promise<never>(() => {})
    render(<PricingSection {...props({ api: { llm: { models: () => never } } as never })} />)
    expect(screen.getByText('加载中…')).toBeTruthy()
  })

  it('surfaces a catalog failure with a retry button', async () => {
    const fail = async () => { throw new Error('boom') }
    const first = vi.fn(fail)
    render(<PricingSection {...props({ api: { llm: { models: first } } as never })} />)
    expect(await screen.findByText('模型目录加载失败。')).toBeTruthy()
    fireEvent.click(screen.getByText('重试'))
    expect(first).toHaveBeenCalledTimes(2)
  })

  it('renders an empty message when the catalog and the stored entries are both empty', async () => {
    const usePricing = (() => snapshot({ value: { entries: [] } })) as unknown as PricingSectionProps['usePricing']
    render(<PricingSection {...props({ usePricing, api: catalogApi([], []) as unknown as PricingSectionProps['api'] })} />)
    expect(await screen.findByText('当前没有可用的提供方或模型。')).toBeTruthy()
  })

  it('appends stored entries whose provider is missing from the catalog as orphan rows', async () => {
    const usePricing = (() => snapshot({
      value: { entries: [{ ...ENTRY, provider: 'legacy', model: 'custom-model' }] },
    })) as unknown as PricingSectionProps['usePricing']
    render(<PricingSection {...props({ usePricing })} />)
    // The provider id appears twice (row name and route tag), so only the
    // model id and the orphan tag are unique query anchors.
    expect(await screen.findByText('custom-model')).toBeTruthy()
    expect(screen.getAllByText('未发现于目录').length).toBeGreaterThan(0)
    expect(screen.getAllByText('legacy').length).toBeGreaterThan(0)
  })
})
