import {
  type Formatters,
  type IntlConfig,
  IntlError,
  IntlErrorCode,
} from '@formatjs/intl'
import type {
  FormatXMLElementFn,
  PrimitiveType,
  Options as IntlMessageFormatOptions,
} from 'intl-messageformat'
import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser'

type Formatter = Formatters['getMessageFormat']

type Config = Pick<IntlConfig, 'locale' | 'formats' | 'onError'>

export function formatCustomMessage<T = string>(
  config: Config,
  getMessageFormat: Formatter,
  message: string | MessageFormatElement[],
  values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T>>,
  opts?: IntlMessageFormatOptions,
) {
  try {
    return getMessageFormat(
      message,
      config.locale,
      config.formats,
      opts,
    ).format(values)
  } catch (err) {
    let messageSlice

    if (typeof message === 'string') {
      messageSlice = message.slice(0, 20)

      if (message.length > 20) {
        messageSlice += '...'
      }
    } else {
      messageSlice = '<compiled message>'
    }

    config.onError?.(
      new IntlError(
        IntlErrorCode.FORMAT_ERROR,
        `Error formatting custom message "${messageSlice}".`,
        err,
      ),
    )
  }

  return ''
}
