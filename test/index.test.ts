import { defineMessages } from '@formatjs/intl'
import { describe, expect, it, vi } from 'vitest'
import { createIntl, createIntlCache } from '../dist/index'

import '../dist/locale-data/en'
import '../dist/locale-data/uk'
import '../dist/locale-data/de'
import '../dist/locale-data/ar'

const now = new Date(2023, 0, 1, 0, 0, 0, 0).getTime()
const second = 1_000
const minute = second * 60
const hour = minute * 60
const day = hour * 24
const week = day * 7
const month = day * 30
const year = month * 12

vi.useFakeTimers()
vi.setSystemTime(now)

function withAbnormalSpacesReplaced(value: string): string {
  return value.replace(/[\u202F\u00A0]/g, ' ')
}

describe('createIntl', () => {
  it('works', () => {
    const intl = createIntl({
      locale: 'en-US',
      defaultLocale: 'en-US',
    })

    expect(intl).toBeDefined()
    expect(intl.formatCompactNumber).toBeDefined()
    expect(intl.formatCustomMessage).toBeDefined()
  })
})

describe('CompactNumber', () => {
  const tests = [
    ['en-US', '1.5K', 1500],
    ['uk', '1,5 тис.', 1500],
    ['de', '1456', 1456],
    ['ar', '١٫٥ ألف', 1500],
  ] as const

  for (const [locale, expectedString, expectedNumber] of tests) {
    const intl = createIntl({
      locale,
    })

    const compactNumber = intl.formatCompactNumber(1456)

    it(`converts to string (${locale})`, () => {
      expect(withAbnormalSpacesReplaced(String(compactNumber))).toBe(
        expectedString,
      )
    })

    it(`converts to number (${locale})`, () => {
      expect(Number(compactNumber)).toBe(expectedNumber)
    })
  }

  // en is the first locale import, means it will be the default locale
  it('errors on unknown locale, but uses "en" as fallback', () => {
    const onError = vi.fn()
    const intl = createIntl({
      // we never added zh-Hans data, so this must error
      locale: 'zh-Hans',
      onError,
    })

    const compactNumber = intl.formatCompactNumber(14567)

    expect(String(compactNumber)).toBe('1.5万')
    expect(Number(compactNumber)).toBe(15000)
    expect(onError).toHaveBeenCalledOnce()
  })
})

describe('IntlShape', () => {
  type CustomElement = {
    type: 'custom'
    value: string
  }

  const messages = defineMessages({
    default: {
      id: 'default',
      defaultMessage: 'Hello, {target}!',
    },
    cats: {
      id: 'cats',
      defaultMessage: '{count, plural, one {{count} cat} other {{count} cats}}',
    },
  } as const)

  type MessagesMap = {
    [K in (typeof messages)[keyof typeof messages]['id']]: string
  }

  const ukMessages: MessagesMap = {
    default: 'Привіт, {target}!',
    cats: '\
{count, plural,\
 one {{count} кіт}\
 few {{count} коти}\
 many {{count} котів}\
 other {{count} кота}\
}',
  }

  const cache = createIntlCache()

  const intl = createIntl<CustomElement>(
    {
      locale: 'uk-UA',
      defaultLocale: 'uk-UA',
      messages: ukMessages,
    },
    cache,
  )

  it('formatMessage (normal)', () => {
    expect(intl.$t(messages.default, { target: 'світ' })).toBe('Привіт, світ!')
  })

  it('formatMessage (number)', () => {
    expect(intl.$t(messages.cats, { count: 1_256 })).toBe('1256 котів')
  })

  it('formatMessage (compactNumber)', () => {
    expect(
      withAbnormalSpacesReplaced(
        intl.$t(messages.cats, {
          count: intl.formatCompactNumber(1_256, {
            maximumFractionDigits: 1,
          }),
        }),
      ),
    ).toBe('1,3 тис. котів')
  })

  it('$ago is the same as formatTimeDifference', () => {
    expect(intl.$ago).toBe(intl.formatTimeDifference)
  })

  it('formatTimeDifference (number/date)', () => {
    const fiveSecondsInPast = now - 5 * second

    const fiveSecondsAgoUk = '5 секунд тому'

    expect(intl.formatTimeDifference(fiveSecondsInPast)).toBe(fiveSecondsAgoUk)

    expect(intl.formatTimeDifference(new Date(fiveSecondsInPast))).toBe(
      fiveSecondsAgoUk,
    )
  })

  it('formatTimeDifference (ranges)', () => {
    const fiveSecondsInFuture = now + 5 * second

    const inFiveSecondsUk = 'через 5 секунд'

    expect(intl.formatTimeDifference({ from: fiveSecondsInFuture })).toBe(
      inFiveSecondsUk,
    )

    expect(
      intl.formatTimeDifference({ from: new Date(fiveSecondsInFuture) }),
    ).toBe(inFiveSecondsUk)

    const tenSecondsInFuture = now + 10 * second

    const fiveSecondsAgoUk = '5 секунд тому'

    expect(
      intl.formatTimeDifference({
        from: fiveSecondsInFuture,
        to: tenSecondsInFuture,
      }),
    ).toBe(fiveSecondsAgoUk)

    expect(
      intl.formatTimeDifference({
        from: new Date(fiveSecondsInFuture),
        to: new Date(tenSecondsInFuture),
      }),
    ).toBe(fiveSecondsAgoUk)
  })

  it('formatTimeDifference (yesterday/tomorrow)', () => {
    const tomorrow = now + day
    const yesterday = now - day

    const tomorrowUk = 'завтра'
    const yesterdayUk = 'учора'

    expect(intl.formatTimeDifference(tomorrow)).toBe(tomorrowUk)
    expect(intl.formatTimeDifference(yesterday)).toBe(yesterdayUk)
  })

  it('formatTimeDifference (max unit)', () => {
    expect(
      intl.formatTimeDifference(now + year, {
        maximumUnit: 'months',
      }),
    ).not.toBe('наступного року')

    expect(
      intl.formatTimeDifference(now + 2 * week, {
        maximumUnit: 'months',
      }),
    ).toBe('через 2 тижні')
  })

  it('formatTimeDifference (min unit)', () => {
    expect(
      intl.formatTimeDifference(now + year, {
        minimumUnit: 'months',
      }),
    ).toBe('через 12 місяців')

    expect(
      intl.formatTimeDifference(now + 2 * week, {
        minimumUnit: 'months',
      }),
    ).not.toBe('через 2 тижні')
  })

  it('formatTimeDifference (units exclusion)', () => {
    expect(
      intl.formatTimeDifference(now + 2 * week, {
        excludedUnits: ['weeks'],
      }),
    ).toBe('через 14 днів')
  })

  it('formatTimeDifference (all units excluded)', () => {
    expect(
      withAbnormalSpacesReplaced(
        intl.formatTimeDifference(now, {
          excludedUnits: [
            'years',
            'quarters',
            'months',
            'weeks',
            'days',
            'hours',
            'minutes',
            'seconds',
          ],
        }),
      ),
    ).toBe('1 січня 2023 р. о 00:00')
  })

  it('formatCustomMessage (only primitives)', () => {
    expect(
      intl.formatCustomMessage(
        '{value} {numericValue, number} is of {variant, select, a {variant A} other {other variant}}',
        {
          value: 'Value',
          numericValue: 15,
          variant: 'a',
        },
      ),
    ).toBe('Value 15 is of variant A')
  })

  it('formatCustomMessage (with objects)', () => {
    expect(
      intl.formatCustomMessage(
        '{value} {numericValue, number} {objectValue} <lower-case>{variant, select, a {A selector} other {Something else}}</lower-case>',
        {
          value: 'Value',
          numericValue: '25',
          objectValue: {
            type: 'custom',
            value: 'is',
          },
          variant: 'a',
          'lower-case'(chunks) {
            return {
              type: 'custom',
              value: String(chunks).toLowerCase(),
            }
          },
        },
      ),
    ).toMatchObject([
      'Value 25 ',
      {
        type: 'custom',
        value: 'is',
      },
      ' ',
      {
        type: 'custom',
        value: 'a selector',
      },
    ])
  })
})
