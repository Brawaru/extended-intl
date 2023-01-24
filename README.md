# extended-intl

> Wrapper for [`@formatjs/intl`](https://npm.im/@formatjs/intl) with additional features.

## Features

### `CompactNumber`

**Requires CLDR data to be imported. Learn more below.**

Create a convertible instances of `CompactNumber`, an object representing a number formatted in compact notation, with ability to convert it to an actual number that you can use to select **correct** plural form — something you can't do with built-in Intl APIs. [Learn more →](https://docs.google.com/document/d/1Wx9Drhpl9p2ZqVZMGQ7KUF4pUfPtuJupv8oQ_Gf6sEE/edit)

Use instance of `CompactNumber` within `formatMessage` as a value to allow for mixed use — both as a number and formatted string, but do not use `#` shorthand, since then the ‘pluralisable’ number will be used:

```ts
const messages = defineMessages({
  users: {
    id: 'users-count',
    defaultMessage: '{count, plural, one {{count} user} other {{count} users}}',
  },
})

intl.formatMessage(messages.users, {
  count: intl.formatCompactNumber(31_411),
})
// => '31.4K users'

intl.formatMessage(messages.users, {
  count: intl.formatCompactNumber(31_411),
})
// => '31,2 тис. користувачів'
```

Just like with any other format methods, the result of `formatCompactNumber` is bound to a specific locale.

### `formatCustomMessage`

Format any messages, even those that are not included in message maps.

```ts
import myMessage from './i18n/en-US/greeting.ast.json'
/* => [
  { type: 0, value: 'Hello, ' },
  { type: 1, value: 'targetName' },
  { type: 0, value: '!' },
] */

// ...

intl.formatCustomMessage(myMessage, {
  targetName: 'world',
})
// => 'Hello, world!'
```

### `formatTimeDifference`

_Based on the code from [Omorphia project by Modrinth](https://github.com/modrinth/omorphia)_.

Given one-two dates, calculates time difference between them, and then formats it in most applicable unit using `Intl.RelativeTimeFormat` and with `numeric` option set to `'automatic'` by default.

Can also be used through alias `$ago`.

```ts
intl.formatTimeDifference(Date.now() - day)
// => 'yesterday'

intl.formatCustomMessage('Published {ago}', {
  ago: intl.$ago(publishedAt),
})
// => 'Published 3 hours ago'
```

It can be configured to cut off after or even before a certain unit, through `minimumUnit` and `maximumUnit` options, in which case it will fallback to formatting the initial date using `dateTimeOptions`:

```ts
intl.formatCustomMessage('Updated {ago}', {
  ago: intl.$ago(lastUpdatedAt, {
    maximumUnit: 'months',
  }),
})
// + { lastUpdatedAt: Date.now() - (2 * day) }
// => 'Updated 2 days ago'

// + { lastUpdatedAt: Date.now() - year }
// => 'Updated December 31, 2021 at 2:44 PM'
```

By default it uses all relative units except for quarters, however you can change it by passing `excludedUnits` option:

```ts
intl.formatCustomMessage('Updated {ago}', {
  ago: intl.$ago(lastUpdatedAt),
})
// + { lastUpdatedAt: Date.now() - (8 * day) }
// => 'Updated last week'

intl.formatCustomMessage('Updated {ago}', {
  ago: intl.$ago(lastUpdatedAt, {
    excludedUnits: ['quarters', 'weeks'],
  }),
})
// + { lastUpdatedAt: Date.now() - (8 * day) }
// => 'Updated 8 days ago'
```

## Install

This package must be installed together with original `@formatjs/intl`.

**npm**

```sh
npm install @formatjs/intl @braw/extended-intl
```

**pnpm**

```sh
pnpm install @formatjs/intl @braw/extended-intl
```

**yarn**

```sh
yarn add @formatjs/intl @braw/extended-intl
```

## Usage

Since it's a wrapper on top of `IntlShape` from the original package, you can replace your existing `createIntl` call from `@formatjs/intl` to the one in `@braw/extended-intl`.

Alias for `createIntlCache` is also available, and while it's identical to the original, it might be more convenient to import both functions from the same place. There should not be any breaking changes when switching the libraries.

This package is written in TypeScript and almost all methods contain documentation.

## CLDR locale data

Since `CompactNumber` relies on CLDR data that is not available through browser built-in APIs, additional data needs to be imported. Without it, the results of `CompactNumber` will be inaccurate and the API itself is pointless.

To import locale data import one of the files from `/locale-data`:

```ts
// The first imported locale is considered the fallback if data is missing
import '@braw/extended-intl/locale-data/en'
import '@braw/extended-intl/locale-data/uk'

import { setDefaultNumberFormatDataLocale } from '@braw/extended-intl'

setDefaultNumberFormatDataLocale('uk') // set alternative fallback data
```

## Acknowledgements

This project is fully powered by the works of [Format.JS authors](https://formatjs.io/).
