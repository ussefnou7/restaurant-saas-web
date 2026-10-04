import test from 'node:test'
import assert from 'node:assert/strict'
import { en } from '../src/i18n/locales/en/index.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'
import { translateApiError } from '../src/utils/errors.ts'

for (const [locale, dictionary] of Object.entries({ en, ar })) {
  test(`${locale}: overlapping leave has a translated error`, () => {
    const expected = dictionary['errors.LEAVE_REQUEST_OVERLAP']
    assert.ok(expected)
    const result = translateApiError({ errorCode: 'LEAVE_REQUEST_OVERLAP', message: 'SERVER DEBUG' },
      (key) => dictionary[key] ?? key)
    assert.equal(result.message, expected)
    assert.notEqual(result.message, 'SERVER DEBUG')
  })
}
