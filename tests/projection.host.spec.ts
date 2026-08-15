/**
 * The `tokenPricing` projection unit: pure fold behavior over synthetic
 * session logs — route attribution from request headers, per-turn grouping,
 * usage-absent skipping, defensive duplicates, and view validation.
 */

import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { tokenPricingProjectionDefinition } from '../src/projection.ts'
import type { TokenPricingProjection } from '../src/types.ts'

function event<T extends SessionEvent['type']>(
  type: T,
  seq: number,
  time: number,
  data: SessionEvent<T>['data'],
): SessionEvent<T> {
  return { type, seq, time, data } as SessionEvent<T>
}

function header(provider: string, model: string): SessionEvent<'request/header'> {
  return event('request/header', 0, 0, {
    header: { config: { provider, model } },
    reason: 'initial',
  })
}

function message(
  turn: number,
  step: number,
  seq: number,
  time: number,
  usage?: SessionEvent<'assistant/message'>['data']['usage'],
): SessionEvent<'assistant/message'> {
  return event('assistant/message', seq, time, {
    turn,
    step,
    // The fold reads only the usage record; the message body is a cast
    // fixture the projection never touches.
    message: {
      id: 'assistant-message',
      role: 'assistant',
      content: [],
      source: { kind: 'model', provider: 'p', model: 'm' },
    },
    ...usage === undefined ? {} : { usage },
  } as unknown as SessionEvent<'assistant/message'>['data'])
}

const USAGE: NonNullable<SessionEvent<'assistant/message'>['data']['usage']> = {
  inputTokens: 100_000,
  cacheReadTokens: 50_000,
  cacheWriteTokens: 10_000,
  outputTokens: 2_000,
}

function fold(events: readonly SessionEvent[]): TokenPricingProjection {
  let state = tokenPricingProjectionDefinition.init()
  for (const next of events) state = tokenPricingProjectionDefinition.apply(state, next)
  return tokenPricingProjectionDefinition.view(state)
}

describe('tokenPricing projection', () => {
  it('groups usage-bearing messages into turns under the latest header route', () => {
    const view = fold([
      header('deepseek-official', 'deepseek-chat'),
      event('turn/start', 1, 100, { turn: 1 }),
      message(1, 1, 2, 200, USAGE),
      message(1, 1, 3, 210, undefined),
      event('turn/start', 4, 300, { turn: 2 }),
      message(2, 1, 5, 400, USAGE),
    ])
    expect(view).toEqual({
      turns: [
        {
          turn: 1,
          startTime: 100,
          steps: [{
            step: 1,
            provider: 'deepseek-official',
            model: 'deepseek-chat',
            time: 200,
            inputTokens: 100_000,
            cacheReadTokens: 50_000,
            cacheWriteTokens: 10_000,
            outputTokens: 2_000,
          }],
        },
        {
          turn: 2,
          startTime: 300,
          steps: [{
            step: 1,
            provider: 'deepseek-official',
            model: 'deepseek-chat',
            time: 400,
            inputTokens: 100_000,
            cacheReadTokens: 50_000,
            cacheWriteTokens: 10_000,
            outputTokens: 2_000,
          }],
        },
      ],
    })
  })

  it('attributes steps after a mid-session header change to the new route', () => {
    const view = fold([
      header('a', 'model-a'),
      event('turn/start', 1, 100, { turn: 1 }),
      message(1, 1, 2, 200, USAGE),
      event('request/header', 3, 250, {
        header: { config: { provider: 'b', model: 'model-b' } },
        reason: 'change',
      }),
      message(1, 2, 4, 300, USAGE),
    ])
    expect(view.turns[0]?.steps.map(step => [step.provider, step.model])).toEqual([
      ['a', 'model-a'],
      ['b', 'model-b'],
    ])
  })

  it('accrues a duplicate message for one step once (defensive)', () => {
    const view = fold([
      header('a', 'm'),
      event('turn/start', 1, 100, { turn: 1 }),
      message(1, 1, 2, 200, USAGE),
      message(1, 1, 3, 220, USAGE),
    ])
    expect(view.turns[0]?.steps).toHaveLength(1)
    expect(view.turns[0]?.steps[0]?.time).toBe(200)
  })

  it('opens a defensive turn stamped with the message time when no turn/start preceded it', () => {
    const view = fold([
      header('a', 'm'),
      message(4, 2, 1, 500, USAGE),
    ])
    expect(view.turns).toEqual([{
      turn: 4,
      startTime: 500,
      steps: [{
        step: 2,
        provider: 'a',
        model: 'm',
        time: 500,
        inputTokens: 100_000,
        cacheReadTokens: 50_000,
        cacheWriteTokens: 10_000,
        outputTokens: 2_000,
      }],
    }])
  })

  it('keeps usage-absent messages out of the view and empty turns visible', () => {
    const view = fold([
      header('a', 'm'),
      event('turn/start', 1, 100, { turn: 1 }),
      message(1, 1, 2, 200, undefined),
      event('turn/start', 3, 300, { turn: 2 }),
      message(2, 1, 4, 400, USAGE),
    ])
    expect(view.turns).toHaveLength(2)
    expect(view.turns[0]?.steps).toEqual([])
    expect(view.turns[1]?.steps).toHaveLength(1)
  })

  it('validates its own view through the wire schema', () => {
    const view = fold([header('a', 'm'), event('turn/start', 1, 100, { turn: 1 }), message(1, 1, 2, 200, USAGE)])
    expect(tokenPricingProjectionDefinition.schema.parse(view)).toEqual(view)
    expect(() => tokenPricingProjectionDefinition.schema.parse({
      turns: [{ turn: -1, startTime: 0, steps: [] }],
    })).toThrow()
  })
})
