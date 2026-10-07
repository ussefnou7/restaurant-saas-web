import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the real service functions with a recording HTTP boundary. Authentication belongs
// to the shared API client/server, never to a local cached user id in a mutation service.
const cases = [
  ['physicalCountService', ['createPhysicalCount', 'addPhysicalCountMaterials',
    'removePhysicalCountMaterials', 'startPhysicalCount', 'cancelPhysicalCount',
    'updateCountedQuantities', 'reconcilePhysicalCount', 'revertPhysicalCountToDraft',
    'deletePhysicalCount']],
  ['wasteDocumentService', ['createWasteDocument', 'updateWasteDocument', 'addWasteLine',
    'updateWasteLine', 'deleteWasteLine', 'completeWasteDocument', 'postWasteDocument',
    'cancelWasteDocument', 'uncompleteWasteDocument']],
  ['inventoryService', ['addMaterialToWarehouse']],
] as const

for (const [service, mutations] of cases) {
  for (const cachedUser of [null, { id: 999, tenantId: 7 }]) {
    test(`${service}: mutations ignore ${cachedUser ? 'forged' : 'missing'} cached actor (L043)`, async () => {
      const calls: { method: string; args: unknown[] }[] = []
      let authReads = 0
      const api = Object.fromEntries(['get', 'post', 'put', 'patch', 'delete'].map(method =>
        [method, async (...args: unknown[]) => {
          calls.push({ method, args })
          return { data: { id: 42 } }
        }]))
      const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {}
      const source = fs.readFileSync(`src/services/${service}.ts`, 'utf8')
      const compiled = ts.transpileModule(source, { compilerOptions: {
        module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      } }).outputText
      vm.runInNewContext(compiled, { exports, URLSearchParams, require: (name: string) => {
        if (name === './api') return { api }
        if (name === './authService') return { authService: { getAuthUser: () => {
          authReads++
          return cachedUser
        } } }
        throw new Error(`Unexpected runtime dependency: ${name}`)
      } })
      for (const mutation of mutations) {
        const before = calls.length
        const args = mutation.startsWith('create') ? [{}]
          : mutation === 'uncompleteWasteDocument' ? [42, 'correction']
          : mutation === 'updateWasteLine' ? [42, 43, {}] : [42, {}]
        await exports[mutation](...args)
        assert.equal(calls.length, before + 1, mutation)
        const call = calls.at(-1)!
        const config = call.args[call.method === 'delete' ? 1 : 2]
        assert.equal(config, undefined, `${mutation} must use the shared API authentication`)
      }
      assert.equal(authReads, 0, 'cached actor must not gate or attribute mutations')
    })
  }
}
