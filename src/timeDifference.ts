import {
  type IntlFormatters,
  type ResolvedIntlConfig,
  type FormatRelativeTimeOptions,
  type FormatDateOptions,
  IntlError,
  IntlErrorCode,
} from '@formatjs/intl'

// Based on the original code from Omorphia, Modrinth
//
// MIT LICENSE - Copyright © 2022 Modrinth
// https://github.com/modrinth/omorphia/blob/2388d1782fee88ed917c5c4117869345b1d05b78/LICENSE.md
//
// Original code:
// https://github.com/modrinth/omorphia/blob/0e1c7cd8ed1bea00e9063b6e11ca602f49342ba7/src/utils/ago.ts

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const QUARTER = 3 * MONTH
const YEAR = 365 * DAY

/**
 * Represents an interval matcher which is a tuple of elements:
 *
 * - `0`: matching unit
 * - `1`: greater or equal constraint
 * - `2`: divisor for calculating, equals to greater or equal constraint if
 *   omitted
 */
type IntervalMatcher = [
  unit: Intl.RelativeTimeFormatUnitSingular,
  greaterOrEqual: number,
  divisor?: number,
]

const matchers: IntervalMatcher[] = [
  ['year', YEAR],
  ['quarter', QUARTER],
  ['month', MONTH],
  ['week', WEEK],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
  ['second', 0, SECOND],
]

type ToSingularUnit<
  U extends Intl.RelativeTimeFormatUnit | (string & Record<never, never>),
> = U extends 'years'
  ? Exclude<U, 'years'> | 'year'
  : U extends 'quarters'
  ? Exclude<U, 'quarters'> | 'quarter'
  : U extends 'months'
  ? Exclude<U, 'months'> | 'month'
  : U extends 'weeks'
  ? Exclude<U, 'weeks'> | 'week'
  : U extends 'days'
  ? Exclude<U, 'days'> | 'day'
  : U extends 'hours'
  ? Exclude<U, 'hours'> | 'hour'
  : U extends 'minutes'
  ? Exclude<U, 'minutes'> | 'minute'
  : U extends 'seconds'
  ? Exclude<U, 'seconds'> | 'second'
  : U

function normalizeUnit<
  U extends Intl.RelativeTimeFormatUnit | (string & Record<never, never>),
>(unit: U): ToSingularUnit<U> {
  for (const [knownUnit] of matchers) {
    if (knownUnit + 's' === unit) return knownUnit as ToSingularUnit<U>
  }

  return unit as ToSingularUnit<U>
}

/**
 * Describes a union of types that can be used or converted to a timestamp.
 *
 * It must be either:
 *
 * - `string` which can be used to construct [`Date`]({@link Date}) object.
 * - `number` that contains a timestamp, a number of seconds since 1 Jan 1970 UTC.
 * - [`Date`]({@link Date}) object on which [`getTime`]({@link Date#getTime}) will
 *   be executed.
 */
export type TimeRangePart = Date | string | number

/**
 * Describes a type of parameter that contains a time range. Can be either a
 * `from` date (as is or wrapped in an array), or both `from` and `to` dates
 * wrapped in an array. If `to` is not provided it is assumed to be the current
 * date at the moment of executing any function accepting this type.
 */
export type TimeRange =
  | TimeRangePart
  | { from: TimeRangePart; to?: TimeRangePart }

/**
 * Converts provided {@link TimeRangePart} to an actual numeric timestamp, time
 * represented in milliseconds since 1st January 1970 (Epoch).
 *
 * @param value Value to convert.
 * @returns Time represented in milliseconds.
 */
function toTimestamp(value: TimeRangePart): number {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'string') {
    return new Date(value).getTime()
  }

  return Number(value)
}

type Config = Pick<ResolvedIntlConfig, 'onError'>

export interface FormatTimeDifferenceOptions extends FormatRelativeTimeOptions {
  /**
   * Maximum unit after which formatting to relative time should be abandoned
   * and instead end date must be formatted using `dateTimeOptions`.
   *
   * If set to `'none'`, then time difference that exceeds `minimumUnit` will be
   * formatted in relative time.
   *
   * @default 'none'
   */
  maximumUnit?: Intl.RelativeTimeFormatUnit | 'none'

  /**
   * Minimum unit before which formatting to relative time should be abandoned
   * and instead end date must be formatted using `dateTimeOptions`.
   *
   * If set to `'none'`, then any time difference that does not exceed
   * `maximumUnit` will be formatted in relative time.
   *
   * @default 'none'
   */
  minimumUnit?: Intl.RelativeTimeFormatUnit | 'none'

  /**
   * Options for datetime formatting when it reaches the cut-off unit.
   *
   * @default { dateStyle: 'long', timeStyle: 'short' }
   */
  dateTimeOptions?: FormatDateOptions

  /**
   * Units to never use for relative time formatting.
   *
   * @default ['quarter']
   */
  excludedUnits?: Intl.RelativeTimeFormatUnit[]
}

type RangePoints = [from: number, to: number]

function extractRangePoints(range: TimeRange): RangePoints {
  let from: number
  let to: number

  if (typeof range === 'object') {
    if (range instanceof Date) {
      from = toTimestamp(range)
      to = Date.now()
    } else {
      from = toTimestamp(range.from)

      if (range.to == null) {
        to = Date.now()
      } else {
        to = toTimestamp(range.to)
      }
    }
  } else {
    from = toTimestamp(range)
    to = Date.now()
  }

  return [from, to]
}

function getExcludedUnits(options?: FormatTimeDifferenceOptions) {
  const excludedUnits: Intl.RelativeTimeFormatUnit[] = []

  const optionsExcludedUnits = options?.excludedUnits

  if (optionsExcludedUnits != null) {
    if (Array.isArray(optionsExcludedUnits)) {
      for (const unit of optionsExcludedUnits) excludedUnits.push(unit)
    } else {
      throw new TypeError(
        'Value is not of array type for formatTimeDifference options property excludedUnits',
      )
    }
  } else {
    excludedUnits.push('quarter')
  }

  return excludedUnits
}

function filterMatchers(options?: FormatTimeDifferenceOptions) {
  let filteredMatchers: IntervalMatcher[]

  const excludedUnits = getExcludedUnits(options)

  if (excludedUnits.length === 0) {
    filteredMatchers = matchers
  } else {
    filteredMatchers = [...matchers]

    for (const unit of excludedUnits) {
      const normalizedUnit = normalizeUnit(unit)

      const matcherToExcludeIndex = filteredMatchers.findIndex(
        (matcher) => matcher[0] === normalizedUnit,
      )

      if (matcherToExcludeIndex === -1) {
        throw new RangeError(
          `Value ${unit} out of range for formatTimeDifference options property excludedUnits`,
        )
      }

      filteredMatchers.splice(matcherToExcludeIndex, 1)
    }
  }

  return filteredMatchers
}

function getMinimumMaximumUnits(
  options?: FormatTimeDifferenceOptions,
): readonly [
  minimumUnit: Intl.RelativeTimeFormatUnitSingular | 'none',
  maximumUnit: Intl.RelativeTimeFormatUnitSingular | 'none',
] {
  let minUnit = options?.minimumUnit ?? 'none'
  let maxUnit = options?.maximumUnit ?? 'none'

  if (minUnit !== 'none') {
    minUnit = normalizeUnit(String(minUnit) as Intl.RelativeTimeFormatUnit)
  }

  if (maxUnit !== 'none') {
    maxUnit = normalizeUnit(String(maxUnit) as Intl.RelativeTimeFormatUnit)
  }

  return [minUnit, maxUnit] as const
}

function calculateBoundaries(
  filteredMatchers: IntervalMatcher[],
  minimumUnit: string,
  maximumUnit: string,
): readonly [minimumUnitMatcherIndex: number, maximumUnitMatcherIndex: number] {
  const maximumUnitMatcherIndex =
    maximumUnit === 'none'
      ? 0
      : filteredMatchers.findIndex((matcher) => matcher[0] === maximumUnit)

  let minimumUnitMatcherIndex: number

  if (minimumUnit === 'none') {
    minimumUnitMatcherIndex =
      filteredMatchers.length > 0 ? filteredMatchers.length - 1 : 0
  } else {
    minimumUnitMatcherIndex = filteredMatchers.findIndex(
      (matcher) => matcher[0] === minimumUnit,
    )
  }

  const minimumUnitGreaterThanMaximumUnit =
    minimumUnitMatcherIndex < maximumUnitMatcherIndex
  const minimumUnitOutOfRange =
    minimumUnit !== 'none' && minimumUnitMatcherIndex === -1
  const maximumUnitOutOfRange =
    maximumUnit !== 'none' && maximumUnitMatcherIndex === -1

  if (
    minimumUnitGreaterThanMaximumUnit ||
    minimumUnitOutOfRange ||
    maximumUnitOutOfRange
  ) {
    let invalidValue: string
    let invalidProperty: keyof FormatTimeDifferenceOptions

    if (minimumUnitOutOfRange || minimumUnitGreaterThanMaximumUnit) {
      invalidValue = minimumUnit
      invalidProperty = 'minimumUnit'
    } else if (maximumUnitOutOfRange) {
      invalidValue = maximumUnit
      invalidProperty = 'maximumUnit'
    }

    throw new RangeError(
      `Value ${invalidValue!} out of range for formatTimeDifference options property ${invalidProperty!}`,
    )
  }

  if (minimumUnitMatcherIndex === -1) {
    minimumUnitMatcherIndex = filteredMatchers.length - 1
  }

  return [minimumUnitMatcherIndex, maximumUnitMatcherIndex]
}

function tryFormattingAsRelativeTime(
  formatRelativeTime: IntlFormatters['formatRelativeTime'],
  from: number,
  to: number,
  options?: FormatTimeDifferenceOptions,
): string | null {
  const filteredMatchers = filterMatchers(options)

  if (filteredMatchers.length === 0) return null

  const [minimumUnit, maximumUnit] = getMinimumMaximumUnits(options)

  const [minimumUnitMatcherIndex, maximumUnitMatcherIndex] =
    calculateBoundaries(filteredMatchers, minimumUnit, maximumUnit)

  const diff = to - from
  const diffAbs = Math.abs(diff)

  for (
    let currentMatcherIndex = Math.max(maximumUnitMatcherIndex - 1, 0);
    currentMatcherIndex <= minimumUnitMatcherIndex;
    currentMatcherIndex++
  ) {
    const matcher = filteredMatchers[currentMatcherIndex]

    if (diffAbs < matcher[1]) continue

    if (currentMatcherIndex < maximumUnitMatcherIndex) break

    const roundedDivision = Math.round(
      diffAbs / matcher[matcher.length > 2 ? 2 : 1]!,
    )

    return formatRelativeTime(
      diff < 0 ? roundedDivision : -roundedDivision,
      matcher[0],
      {
        numeric: 'auto',
        ...options, // no worries about extra options, it'll weed them out
      },
    )
  }

  return null
}

/**
 * Given a specific time range or just a start date calculates the time
 * difference between the two (if just start date is provided, then the end date
 * assumed is to be the time at the moment of the call), it then selects the
 * preferable unit to display that difference and returns a formatted string
 * using that (e.g. in 5 seconds, 10 seconds ago).
 *
 * It uses {@link Intl.RelativeTimeFormat} under the hood, but with one notable
 * difference - option `numeric` is set to `'auto'` be default, meaning
 * differences such as +1 day will be formatted as 'tomorrow' and -1 day as
 * 'yesterday'. This default can be fully overridden via options to match the
 * original behaviour of {@link Intl.RelativeTimeFormat}, which is to use
 * `'always'` by default for `numeric`.
 *
 * @param config IntlShape config.
 * @param formatRelativeTime Formatter function.
 * @param range Range for which time difference is calculated.
 * @param options Options for relative time formatter.
 * @returns Largest unit available to display the time.
 */
export function formatTimeDifference(
  { onError }: Config,
  formatRelativeTime: IntlFormatters['formatRelativeTime'],
  formatDate: IntlFormatters['formatDate'],
  range: TimeRange,
  options?: FormatTimeDifferenceOptions,
): string {
  const reportError = (err: unknown) =>
    onError(
      new IntlError(
        IntlErrorCode.FORMAT_ERROR,
        'Error formatting time difference.',
        err,
      ),
    )

  let from: number, to: number
  try {
    ;[from, to] = extractRangePoints(range)
  } catch (err) {
    reportError(err)
    return ''
  }

  try {
    const relative = tryFormattingAsRelativeTime(
      formatRelativeTime,
      from,
      to,
      options,
    )

    if (relative != null) return relative
  } catch (err) {
    reportError(err)
  }

  try {
    return formatDate(
      from,
      options?.dateTimeOptions ?? {
        dateStyle: 'long',
        timeStyle: 'short',
      },
    )
  } catch (err) {
    reportError(err)
  }

  return ''
}
