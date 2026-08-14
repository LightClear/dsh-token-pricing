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
 * No runtime invariant: one settings-namespace registration and two slot
 * registrations whose disposal is proven by the apply spec — the plugin owns
 * no store of its own (the pricing section lives in the settings scope),
 * emits no cordis events, and holds no cross-plugin mutable state.
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
