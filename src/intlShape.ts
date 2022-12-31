import {
  createIntl as _createIntl,
  type IntlCache,
  type IntlConfig,
} from '@formatjs/intl'
import { formatCompactNumber, isCompactNumber } from './compactNumber.js'
import { formatCustomMessage } from './customMessage.js'
import { formatTimeDifference as formatTimeDifferenceImpl } from './timeDifference.js'
import type { IntlShape } from './types.js'

export function createIntl<T = string>(
  config: IntlConfig<T>,
  cache?: IntlCache,
): IntlShape<T> {
  const shape = _createIntl(config, cache) as IntlShape<T>

  shape.formatCompactNumber = formatCompactNumber.bind(
    null,
    shape.formatters.getNumberFormat,
    shape,
  )

  shape.formatCustomMessage = formatCustomMessage.bind(
    null,
    shape,
    shape.formatters.getMessageFormat,
  ) as IntlShape<T>['formatCustomMessage']

  const formatTimeDifference = formatTimeDifferenceImpl.bind(
    null,
    shape,
    shape.formatRelativeTime,
    shape.formatDate,
  )

  shape.formatTimeDifference = formatTimeDifference

  shape.$ago = formatTimeDifference

  const formatMessage = shape.formatMessage

  type formatMessage$Params = Parameters<IntlShape<T>['formatMessage']>

  function normalized$formatMessage(
    descriptor: formatMessage$Params[0],
    values?: formatMessage$Params[1],
    opts?: formatMessage$Params[2],
  ) {
    const result = formatMessage(descriptor, values, opts)

    if (Array.isArray(result)) {
      for (let i = 0, l = result.length; i < l; i++) {
        const part = result[i]

        if (isCompactNumber(part)) {
          result[i] = String(part)
        }
      }

      if (result.every((part) => typeof part === 'string')) {
        return result.join('')
      }
    }

    return result
  }

  shape.$t = normalized$formatMessage as IntlShape['formatMessage']
  shape.formatMessage = normalized$formatMessage as IntlShape['formatMessage']

  return shape
}

export { createIntlCache } from '@formatjs/intl'
