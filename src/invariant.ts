/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-token-pricing`.
 * @module @deepseek-ai/dsh-client-token-pricing/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-token-pricing'

/** Cordis companion plugin name. */
export const name = 'client-token-pricing-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package owns a durable settings section (whose
 * wire values the settings provider schema-validates) and a single pure
 * projection fold whose wire payload the projection registry validates at
 * every snapshot and change-feed emission. The event relations the fold
 * relies on (one assembled `assistant/message` per step, `request/header`
 * logged before its dispatch, monotonic host-assigned turn numbers) are
 * owned and runtime-checked by dsh-agent-loop and the session surface, not
 * here. Registration disposal is proven by the apply specs, and the plugin
 * holds no cross-plugin mutable state of its own (drafts live in the
 * settings scope, fold state in the projection registry's cells).
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
