/**
 * Frontend paths for {@code AdminInventoryCatalogController}
 * Base: {@code @RequestMapping("/api/admin/inventory")}
 */
export const ADMIN_INVENTORY_BASE = '/api/admin/inventory'

export const adminInventoryEndpoints = {
  seed: {
    globalCatalog: `${ADMIN_INVENTORY_BASE}/seed-global-catalog`,
    demoTenantData: (tenantId: number | string) =>
      `${ADMIN_INVENTORY_BASE}/seed-demo-tenant-data/${tenantId}`,
  },
  uoms: {
    list: `${ADMIN_INVENTORY_BASE}/uoms`,
    byId: (id: number | string) => `${ADMIN_INVENTORY_BASE}/uoms/${id}`,
    create: `${ADMIN_INVENTORY_BASE}/uoms`,
    update: (id: number | string) => `${ADMIN_INVENTORY_BASE}/uoms/${id}`,
    activate: (id: number | string) => `${ADMIN_INVENTORY_BASE}/uoms/${id}/activate`,
    deactivate: (id: number | string) => `${ADMIN_INVENTORY_BASE}/uoms/${id}/deactivate`,
  },
  globalMaterialCategories: {
    list: `${ADMIN_INVENTORY_BASE}/global-material-categories`,
    byId: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-material-categories/${id}`,
    create: `${ADMIN_INVENTORY_BASE}/global-material-categories`,
    update: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-material-categories/${id}`,
    activate: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-material-categories/${id}/activate`,
    deactivate: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-material-categories/${id}/deactivate`,
  },
  globalMaterials: {
    list: `${ADMIN_INVENTORY_BASE}/global-materials`,
    byId: (id: number | string) => `${ADMIN_INVENTORY_BASE}/global-materials/${id}`,
    create: `${ADMIN_INVENTORY_BASE}/global-materials`,
    update: (id: number | string) => `${ADMIN_INVENTORY_BASE}/global-materials/${id}`,
    activate: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-materials/${id}/activate`,
    deactivate: (id: number | string) =>
      `${ADMIN_INVENTORY_BASE}/global-materials/${id}/deactivate`,
  },
} as const
