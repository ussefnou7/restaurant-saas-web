/**
 * Frontend paths for {@code UomController}
 * Base: {@code @RequestMapping("/api/uom")}
 */
export const UOM_BASE = '/api/uom'

export const uomEndpoints = {
  base: UOM_BASE,
  lookup: `${UOM_BASE}/lookup`,
  byId: (id: number | string) => `${UOM_BASE}/${id}`,
  create: UOM_BASE,
  deactivate: (id: number | string) => `${UOM_BASE}/${id}/deactivate`,
  delete: (id: number | string) => `${UOM_BASE}/${id}`,
} as const
