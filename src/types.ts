import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser'
import type {
  Formatters,
  IntlFormatters as _IntlFormatters,
  MessageDescriptor,
  ResolvedIntlConfig,
} from '@formatjs/intl'
import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat'
import type {
  CompactNumber,
  FormatCompactNumberOptions,
} from './compactNumber.js'
import type {
  FormatTimeDifferenceOptions,
  TimeRange,
} from './timeDifference.js'

export type IntlFormatters<TBase = unknown> = _IntlFormatters<TBase> & {
  /**
   * Given a specific time range or just a start date calculates the time
   * difference between the two (if just start date is provided, then the end
   * date assumed is to be the time at the moment of the call), it then selects
   * the preferable unit to display that difference and returns a formatted
   * string using that unit (e.g. in 1 day, 2 days ago).
   *
   * It uses {@link Intl.RelativeTimeFormat} under the hood, but with one notable
   * difference - option `numeric` is set to `'auto'` be default, meaning
   * differences such as +1 day will be formatted as 'tomorrow' and -1 day as
   * 'yesterday'. This default can be fully overridden via options to match the
   * original behaviour of {@link Intl.RelativeTimeFormat}, which is to use
   * `'always'` by default for `numeric`.
   *
   * @param range Range for which time difference is calculated.
   * @param options Options for relative time formatter.
   * @returns Largest unit available to display the time.
   */
  formatTimeDifference(
    range: TimeRange,
    options?: FormatTimeDifferenceOptions,
  ): string

  /** Shorthand for {@link IntlFormatters.formatTimeDifference}. */
  $ago(range: TimeRange, options?: FormatTimeDifferenceOptions): string

  formatCompactNumber(
    value: number,
    opts?: FormatCompactNumberOptions,
  ): CompactNumber

  /**
   * Formats custom message using the provided values.
   *
   * @param message Message to format.
   * @param values Values to format message with.
   * @param opts Formatter options.
   * @returns Formatted message contents.
   */
  formatCustomMessage(
    message: string | MessageFormatElement[],
    values?: Record<
      string,
      CompactNumber | PrimitiveType | FormatXMLElementFn<string, string>
    >,
    opts?: IntlMessageFormatOptions,
  ): string

  /**
   * Formats custom message using the provided values.
   *
   * @param message Message to format.
   * @param values Values to format message with.
   * @param opts Formatter options.
   * @returns Formatted message contents.
   */
  formatCustomMessage<T extends TBase>(
    message: string | MessageFormatElement[],
    values?: Record<
      string,
      CompactNumber | PrimitiveType | T | FormatXMLElementFn<T>
    >,
    opts?: IntlMessageFormatOptions,
  ): string | T | (T | string)[]

  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      CompactNumber | PrimitiveType | FormatXMLElementFn<string, string>
    >,
    opts?: IntlMessageFormatOptions,
  ): string

  formatMessage<T extends TBase>(
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      CompactNumber | PrimitiveType | T | FormatXMLElementFn<T>
    >,
    opts?: IntlMessageFormatOptions,
  ): string | T | (T | string)[]

  $t(
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      CompactNumber | PrimitiveType | FormatXMLElementFn<string, string>
    >,
    opts?: IntlMessageFormatOptions,
  ): string

  $t<T extends TBase>(
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      CompactNumber | PrimitiveType | T | FormatXMLElementFn<T>
    >,
    opts?: IntlMessageFormatOptions,
  ): string | T | (T | string)[]
}

export interface IntlShape<T = string>
  extends ResolvedIntlConfig<T>,
    IntlFormatters<T> {
  formatters: Formatters
}
