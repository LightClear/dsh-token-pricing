// @vitest-environment jsdom
/**
 * token-pricing browser half on a real cordis Context with fake
 * settingsScope/connection/remote faces: the plugin registers the dock
 * readout at conversation.composer.dock and the pricing section at
 * settings.section, the hooks compartment carries the pricing scope, the
 * inject faces carry the api and the saveEntries verb, and registration
 * disposal rides the plugin fiber (HMR safety). The node half is exercised
 * over a fake settings service.
 */
import { Context, Service } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry, type SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import type { TokenPricingSettings } from '../src/settings.ts'
import { TOKEN_PRICING_NAMESPACE } from '../src/settings.ts'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'

const sid = (key: string): SessionId => key as SessionId

const EMPTY_SNAPSHOT: SettingsScopeSnapshot<TokenPricingSettings> = {
  status: 'ready',
  value: { entries: [] },
  base: undefined,
  user: undefined,
  revision: 0,
  writable: true,
  mode: 'host',
}

function apiStub() {
  return {
    sessions: { models: async () => ({
      rpcId: 'r' as never,
      result: {
        ok: true,
        value: {
          current: { provider: 'deepseek-official', model: 'deepseek-chat' },
          routable: true,
          groups: [],
          failures: [],
        },
      },
    }) },
    llm: { models: async () => ({
      rpcId: 'r' as never,
      result: { ok: true, value: { groups: [], failures: [] } },
    }) },
  }
}

async function bench() {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  ctx.slots.register({
    name: 'root', children: {
      'conversation.composer.dock': { kind: 'list', scope: 'session' },
      'settings.section': { kind: 'list', scope: 'root' },
    },
  } as never, (() => null) as never)

  const setSpy = vi.fn(async () => {})
  const scope: SettingsScope<TokenPricingSettings> = {
    getSnapshot: () => EMPTY_SNAPSHOT,
    subscribe: () => () => {},
    set: setSpy,
    unset: vi.fn(async () => {}),
  }
  class SettingsScopeService extends Service {
    constructor(serviceCtx: Context) {
      super(serviceCtx, 'settingsScope')
    }
    bind(): SettingsScope<TokenPricingSettings> { return scope }
  }
  new SettingsScopeService(ctx)
  ctx.provide('connection', { api: apiStub(), isLoopback: true })
  ctx.provide('remote', { $on: () => () => {} })

  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return {
    ctx,
    fiber,
    scope,
    setSpy,
    dockEntry: () => ctx.slots.entries('conversation.composer.dock')[0],
    sectionEntry: () => ctx.slots.entries('settings.section')[0],
  }
}

describe('token-pricing browser plugin', () => {
  it('registers the dock readout and the settings section with the pricing scope and faces', async () => {
    const b = await bench()
    const dock = b.dockEntry()
    expect(dock?.options).toMatchObject({ id: 'model-pricing', order: 20 })
    const dockFace = dock?.inject as unknown as ((sessionId: SessionId) => { hooks: { pricing: unknown }; api: unknown }) | undefined
    expect(dockFace).toBeTypeOf('function')
    const dockInjected = dockFace!(sid('s1'))
    expect(dockInjected.hooks.pricing).toBe(b.scope)
    expect(dockInjected.api).toBeDefined()

    const section = b.sectionEntry()
    expect(section?.options).toMatchObject({ id: 'model-pricing', order: 30 })
    expect((section?.options.label as () => string)()).toBe('模型定价')
    const sectionFace = section?.inject as unknown as (() => { hooks: { pricing: unknown }; api: unknown; saveEntries: (entries: unknown[]) => Promise<unknown> }) | undefined
    const sectionInjected = sectionFace!()
    expect(sectionInjected.hooks.pricing).toBe(b.scope)
    await sectionInjected.saveEntries([{ model: 'm' }])
    expect(b.setSpy).toHaveBeenCalledWith('entries', [{ model: 'm' }])
  })

  it('drops both entries when the plugin fiber unloads (HMR safety)', async () => {
    const b = await bench()
    expect(b.dockEntry()).toBeDefined()
    expect(b.sectionEntry()).toBeDefined()
    await b.fiber.dispose()
    expect(b.dockEntry()).toBeUndefined()
    expect(b.sectionEntry()).toBeUndefined()
  })
})

describe('token-pricing node half', () => {
  it('registers the durable namespace through the settings service', async () => {
    const ctx = new Context()
    const register = vi.fn(() => ({ get: () => ({ entries: [] }) }))
    ctx.provide('settings', { register, writable: true })
    const fiber = ctx.plugin({ inject: ['settings'], apply: nodeApply })
    await fiber.await()
    expect(register).toHaveBeenCalledWith(
      settingsNamespace(TOKEN_PRICING_NAMESPACE),
      expect.objectContaining({ type: 'object' }),
    )
  })
})
