/* eslint-disable @typescript-eslint/no-explicit-any -- Small hook harness executes the real page without a DOM dependency. */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

function deferred() {
  let resolve!: (value: any) => void
  let reject!: (error: Error) => void
  const promise = new Promise<any>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

// Only hook scheduling and presentation imports are stubbed. The page's request handlers,
// effect cleanup, loading/error branches and tab/refresh handlers execute unchanged.
function mount() {
  const state: any[] = []
  const effects: { deps: any[]; cleanup?: () => void }[] = []
  const pendingEffects: (() => void)[] = []
  const summaries: ReturnType<typeof deferred>[] = []
  const alerts: ReturnType<typeof deferred>[] = []
  let stateIndex = 0, effectIndex = 0
  const react = {
    useState(initial: any) {
      const index = stateIndex++
      if (!(index in state)) state[index] = initial
      return [state[index], (next: any) => { state[index] = typeof next === 'function' ? next(state[index]) : next }]
    },
    useCallback(callback: any) { return callback },
    useEffect(run: () => (() => void) | undefined, deps: any[]) {
      const index = effectIndex++
      const old = effects[index]
      if (!old || deps.some((dep, i) => !Object.is(dep, old.deps[i]))) {
        pendingEffects.push(() => {
          old?.cleanup?.()
          effects[index] = { deps, cleanup: run() }
        })
      }
    },
  }
  const imports: Record<string, any> = {
    react,
    'react/jsx-runtime': { jsx: (type: any, props: any) => ({ type, props }), jsxs: (type: any, props: any) => ({ type, props }), Fragment: 'fragment' },
    '../../i18n/useTranslation': { useTranslation: () => ({ t: (key: string) => key, locale: 'en' }) },
    '../../utils/format': { formatMoney: String, formatNumber: String, formatDateTime: String },
    '../../services/dashboardService': {
      getDashboardSummary: () => { const request = deferred(); summaries.push(request); return request.promise },
      getDashboardAlerts: () => { const request = deferred(); alerts.push(request); return request.promise },
    },
    './dashboardDisplay': { parseMoney: (value: any) => value == null ? null : Number(value) },
  }
  const source = fs.readFileSync(new URL('../src/pages/dashboard/DashboardPage.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports: any = {}
  new Function('require', 'exports', compiled)((name: string) => imports[name] ?? new Proxy({}, { get: (_, key) => key }), exports)
  function render() {
    stateIndex = 0; effectIndex = 0
    let tree = exports.DashboardPage()
    if (pendingEffects.length) {
      pendingEffects.splice(0).forEach((run) => run())
      stateIndex = 0; effectIndex = 0
      tree = exports.DashboardPage()
    }
    return flatten(tree)
  }
  function flatten(node: any): any[] {
    if (Array.isArray(node)) return node.flatMap(flatten)
    if (!node || typeof node !== 'object') return []
    return [node, ...flatten(node.props?.children)]
  }
  return {
    render, summaries, alerts,
    clickMode(mode: string) { render().find((node) => node.props.role === 'tab' && node.props.children === `dashboard.modes.${mode}`).props.onClick(); render() },
    refresh() { render().find((node) => node.props.className === 'dashboard-page__refresh').props.onClick(); render() },
    unmount() { effects.forEach((effect) => effect.cleanup?.()) },
  }
}
const summary = (sales: number) => ({ kpis: { status: 'OK', data: { netSales: String(sales) } } })
const settle = () => new Promise((resolve) => setImmediate(resolve))
const sales = (app: ReturnType<typeof mount>) => app.render().find((node) => node.props.title === 'dashboard.kpis.netSales')?.props.value

test('late responses cannot replace the selected period; switching periods does not reload alerts', async () => {
  const app = mount(); app.render()
  app.clickMode('year')
  app.summaries[1].resolve(summary(200)); await settle()
  assert.equal(sales(app), '200')
  app.summaries[0].resolve(summary(10)); await settle()
  assert.equal(sales(app), '200')
  assert.equal(app.alerts.length, 1)
})

test('failed period load hides old numbers and shows a retry message', async () => {
  const app = mount(); app.render()
  app.summaries[0].resolve(summary(10)); await settle()
  app.clickMode('month')
  assert.equal(sales(app), undefined)
  app.summaries[1].reject(new Error('offline')); await settle()
  assert.equal(sales(app), undefined)
  assert.ok(app.render().some((node) => node.props.role === 'alert' && node.props.children === 'dashboard.summary.loadError'))
})

test('failed alert refresh discards old all-clear and recovery clears the error', async () => {
  const app = mount(); app.render()
  app.alerts[0].resolve({ groups: [], withheld: [] }); await settle()
  app.refresh()
  app.alerts[1].reject(new Error('query failed')); await settle()
  assert.equal(app.render().find((node) => node.type === 'AttentionStrip').props.alerts, null)
  assert.ok(app.render().some((node) => node.props.children === 'dashboard.alerts.loadError'))
  app.refresh()
  app.alerts[2].resolve({ groups: [], withheld: [] }); await settle()
  assert.ok(!app.render().some((node) => node.props.children === 'dashboard.alerts.loadError'))
})

test('refresh ignores older in-flight summary and alert responses', async () => {
  const app = mount(); app.render(); app.refresh()
  app.summaries[1].resolve(summary(20)); app.alerts[1].resolve({ groups: ['current'], withheld: [] }); await settle()
  app.summaries[0].resolve(summary(10)); app.alerts[0].resolve({ groups: [], withheld: [] }); await settle()
  assert.equal(sales(app), '20')
  assert.deepEqual(app.render().find((node) => node.type === 'AttentionStrip').props.alerts.groups, ['current'])
  app.unmount()
})
