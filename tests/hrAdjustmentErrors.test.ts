import test from 'node:test'
import assert from 'node:assert/strict'
import { en } from '../src/i18n/locales/en/index.ts'
import { ar } from '../src/i18n/locales/ar/index.ts'
import { translateApiError } from '../src/utils/errors.ts'

const cases = [
  { code: 'SALARY_ADJUSTMENT_DATE_IN_FUTURE', params: { today: '2026-10-04' } },
  { code: 'SALARY_ADJUSTMENT_BEFORE_HIRE', params: { hireDate: '2026-01-01' } },
  { code: 'SALARY_DEDUCTION_EXCEEDS_SALARY', params: { salaryAmount: 6000, adjustmentDate: '2026-03-01' } },
]

for (const [locale, dictionary] of Object.entries({ en, ar })) {
  for (const { code, params } of cases) {
    test(`${locale}: ${code} resolves with its parameters and no debug text`, () => {
      const template = dictionary[`errors.${code}`]
      assert.ok(template)
      for (const [, placeholder] of template.matchAll(/\{\{(\w+)\}\}/g)) {
        assert.ok(placeholder in params, `Missing parameter: ${placeholder}`)
      }
      const translated = translateApiError({ errorCode: code, params, message: 'SERVER DEBUG' },
        (key, values) => (dictionary[key] ?? key).replace(/\{\{(\w+)\}\}/g,
          (_, name: string) => String(values?.[name] ?? `{{${name}}}`)))
      assert.ok(!translated.message.includes('SERVER DEBUG'))
      assert.ok(!translated.message.includes('{{'))
      assert.ok(!translated.message.includes('errors.'))
      for (const value of Object.values(params)) {
        assert.ok(translated.message.includes(String(value)))
      }
    })
  }
}
