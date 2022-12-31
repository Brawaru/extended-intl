/// <reference types="node" />

import { NumberFormat } from '@formatjs/intl-numberformat/src/core.js'
import { toLocaleString as _toLocaleString } from '@formatjs/intl-numberformat/src/to_locale_string.js'

function toLocaleString(
  this: number,
  locales: Parameters<typeof _toLocaleString>[1],
  options: Parameters<typeof _toLocaleString>[2],
): string {
  return _toLocaleString(this, locales, options)
}

/**
 * List of all global sites that may or many not contain the `Intl` object, or
 * on which they will be defined.
 *
 * It tries the following sites: `global`, `globalThis`, `window`. If any of
 * those is missing then `null` value will be in its place.
 */
const injectionSites = [
  typeof global === 'undefined' ? null : global,
  typeof globalThis === 'undefined' ? null : globalThis,
  typeof window === 'undefined' ? null : window,
] as const

for (const target of injectionSites) {
  if (target == null) continue

  if ((target.Intl?.NumberFormat ?? null) !== NumberFormat) {
    if (target.Intl == null) target.Intl = {} as any

    Object.defineProperty(target.Intl, 'NumberFormat', {
      configurable: true,
      value: NumberFormat,
    })
  }

  if (target.Number.prototype.toLocaleString !== toLocaleString) {
    Object.defineProperty(target.Number.prototype, 'toLocaleString', {
      configurable: true,
      value: toLocaleString,
    })
  }
}

export default {}
