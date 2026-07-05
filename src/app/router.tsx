import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Root } from './Root'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { ClientLayout } from '../layouts/ClientLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { BranchDetailsPage } from '../pages/branches/BranchDetailsPage'
import { BranchesPage } from '../pages/branches/BranchesPage'
import { MenuHubLayout } from '../pages/menu/MenuHubLayout'
import { MenuCategoriesSection } from '../pages/menu/MenuCategoriesSection'
import { MenuProductsSection } from '../pages/menu/MenuProductsSection'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { AdminHubPage } from '../pages/hubs/AdminHubPage'
import { HomeHubPage } from '../pages/hubs/HomeHubPage'
import { HrHubPage } from '../pages/hubs/HrHubPage'
import { InventoryHubPage } from '../pages/hubs/InventoryHubPage'
import { PurchaseHubPage } from '../pages/hubs/PurchaseHubPage'
import { ReportsHubPage } from '../pages/hubs/ReportsHubPage'
import { SalesHubPage } from '../pages/hubs/SalesHubPage'
import { PurchaseRouteRedirect } from './PurchaseRouteRedirect'
import { EmployeesPage } from '../pages/hr/employees/EmployeesPage'
import { JobsPage } from '../pages/hr/jobs/JobsPage'
import { LeaveRequestsPage } from '../pages/hr/leave-requests/LeaveRequestsPage'
import { LeaveTypesPage } from '../pages/hr/leave-types/LeaveTypesPage'
import { InventorySetupPage } from '../pages/inventory/InventorySetupPage'
import { InventoryTransactionsPage } from '../pages/inventory/InventoryTransactionsPage'
import { StockBalancesPage } from '../pages/inventory/StockBalancesPage'
import { MaterialCatalogImportPage } from '../pages/inventory/MaterialCatalogImportPage'
import { MaterialCategoriesPage } from '../pages/inventory/MaterialCategoriesPage'
import { MaterialsPage } from '../pages/inventory/MaterialsPage'
import { SuppliersPage } from '../pages/inventory/SuppliersPage'
import {
  PurchaseInvoiceCreatePage,
  PurchaseInvoiceEditPage,
  PurchaseInvoiceViewPage,
} from '../pages/inventory/purchase-invoices/PurchaseInvoiceFormPage'
import { PurchaseInvoicesPage } from '../pages/inventory/purchase-invoices/PurchaseInvoicesPage'
import {
  PurchaseReturnCreatePage,
  PurchaseReturnViewPage,
} from '../pages/inventory/purchase-returns/PurchaseReturnFormPage'
import { PurchaseReturnsPage } from '../pages/inventory/purchase-returns/PurchaseReturnsPage'
import { WarehousesPage } from '../pages/inventory/WarehousesPage'
import { WarehouseDetailsPage } from '../pages/inventory/WarehouseDetailsPage'
import { TenantUomPage } from '../pages/inventory/settings/uom/TenantUomPage'
import { AdminMaterialCatalogPage } from '../pages/inventory/admin/AdminMaterialCatalogPage'
import { AdminMaterialCategoriesPage } from '../pages/inventory/admin/AdminMaterialCategoriesPage'
import { AdminUomsPage } from '../pages/inventory/admin/AdminUomsPage'
import { InventorySeedPage } from '../pages/inventory/admin/InventorySeedPage'
import { TransfersPage } from '../pages/inventory/transfers/TransfersPage'
import { TransferCreatePage, TransferViewPage } from '../pages/inventory/transfers/TransferFormPage'
import { PhysicalCountsPage } from '../pages/inventory/physical-counts/PhysicalCountsPage'
import { PhysicalCountCreatePage, PhysicalCountViewPage } from '../pages/inventory/physical-counts/PhysicalCountFormPage'
import { WasteDocumentCreatePage } from '../pages/inventory/waste-documents/WasteDocumentCreatePage'
import { WasteDocumentDetailPage } from '../pages/inventory/waste-documents/WasteDocumentDetailPage'
import { WasteDocumentsPage } from '../pages/inventory/waste-documents/WasteDocumentsPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OrdersPage } from '../pages/orders/OrdersPage'
import { PosPage } from '../pages/pos/PosPage'
import { ReportsPage } from '../pages/reports/ReportsPage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { UserDetailsPage } from '../pages/users/UserDetailsPage'
import { UsersPage } from '../pages/users/UsersPage'
import { EmployeeDetailsPage } from '../pages/hr/employees/EmployeeDetailsPage'

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: (
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            children: [
              { index: true, element: <HomeHubPage /> },
              { path: 'overview', element: <DashboardPage /> },
            ],
          },
          {
            path: 'sales',
            element: <SalesHubPage />,
          },
          {
            path: 'pos',
            element: <PosPage />,
          },
          {
            path: 'orders',
            element: <OrdersPage />,
          },
          {
            path: 'menu',
            element: <MenuHubLayout />,
            children: [
              { index: true, element: <Navigate to="/menu/categories" replace /> },
              { path: 'categories', element: <MenuCategoriesSection /> },
              { path: 'products', element: <MenuProductsSection /> },
            ],
          },
          {
            path: 'products',
            element: <Navigate to="/menu/products" replace />,
          },
          {
            path: 'categories',
            element: <Navigate to="/menu/categories" replace />,
          },
          {
            path: 'branches',
            children: [
              { index: true, element: <BranchesPage /> },
              { path: ':branchId', element: <BranchDetailsPage /> },
            ],
          },
          {
            path: 'inventory',
            children: [
              {
                index: true,
                element: <InventoryHubPage />,
              },
              {
                path: 'setup',
                element: <InventorySetupPage />,
              },
              {
                path: 'catalog-import',
                element: <MaterialCatalogImportPage />,
              },
              {
                path: 'materials',
                element: <MaterialsPage />,
              },
              {
                path: 'material-categories',
                element: <MaterialCategoriesPage />,
              },
              {
                path: 'warehouses',
                children: [
                  { index: true, element: <WarehousesPage /> },
                  { path: ':warehouseId', element: <WarehouseDetailsPage /> },
                ],
              },
              {
                path: 'settings/uom',
                element: <TenantUomPage />,
              },
              {
                path: 'suppliers',
                element: (
                  <PurchaseRouteRedirect
                    fromPrefix="/inventory/suppliers"
                    toPrefix="/purchase/suppliers"
                  />
                ),
              },
              {
                path: 'purchase-invoices/*',
                element: (
                  <PurchaseRouteRedirect
                    fromPrefix="/inventory/purchase-invoices"
                    toPrefix="/purchase/purchase-invoices"
                  />
                ),
              },
              {
                path: 'purchase-returns/*',
                element: (
                  <PurchaseRouteRedirect
                    fromPrefix="/inventory/purchase-returns"
                    toPrefix="/purchase/purchase-returns"
                  />
                ),
              },
              {
                path: 'transfers',
                children: [
                  { index: true, element: <TransfersPage /> },
                  { path: 'new', element: <TransferCreatePage /> },
                  { path: ':id', element: <TransferViewPage /> },
                ],
              },
              {
                path: 'physical-counts',
                children: [
                  { index: true, element: <PhysicalCountsPage /> },
                  { path: 'new', element: <PhysicalCountCreatePage /> },
                  { path: ':id', element: <PhysicalCountViewPage /> },
                ],
              },
              {
                path: 'waste-documents',
                children: [
                  { index: true, element: <WasteDocumentsPage /> },
                  { path: 'new', element: <WasteDocumentCreatePage /> },
                  { path: ':id', element: <WasteDocumentDetailPage /> },
                ],
              },
              {
                path: 'stock-balances',
                element: <StockBalancesPage />,
              },
              {
                path: 'transactions',
                element: <InventoryTransactionsPage />,
              },
              {
                path: 'admin',
                children: [
                  {
                    index: true,
                    element: <Navigate to="/inventory/admin/uoms" replace />,
                  },
                  { path: 'uoms', element: <AdminUomsPage /> },
                  {
                    path: 'material-categories',
                    element: <AdminMaterialCategoriesPage />,
                  },
                  { path: 'material-catalog', element: <AdminMaterialCatalogPage /> },
                  { path: 'seed', element: <InventorySeedPage /> },
                ],
              },
            ],
          },
          {
            path: 'purchase',
            children: [
              { index: true, element: <PurchaseHubPage /> },
              { path: 'suppliers', element: <SuppliersPage /> },
              {
                path: 'purchase-invoices',
                children: [
                  { index: true, element: <PurchaseInvoicesPage /> },
                  { path: 'new', element: <PurchaseInvoiceCreatePage /> },
                  { path: ':id/edit', element: <PurchaseInvoiceEditPage /> },
                  { path: ':id', element: <PurchaseInvoiceViewPage /> },
                ],
              },
              {
                path: 'purchase-returns',
                children: [
                  { index: true, element: <PurchaseReturnsPage /> },
                  { path: 'new', element: <PurchaseReturnCreatePage /> },
                  { path: ':id', element: <PurchaseReturnViewPage /> },
                ],
              },
            ],
          },
          {
            path: 'materials',
            element: <Navigate to="/inventory/materials" replace />,
          },
          {
            path: 'users',
            children: [
              { index: true, element: <UsersPage /> },
              { path: ':userId', element: <UserDetailsPage /> },
            ],
          },
          {
            path: 'hr',
            children: [
              { index: true, element: <HrHubPage /> },
              { path: 'jobs', element: <JobsPage /> },
              {
                path: 'employees',
                children: [
                  { index: true, element: <EmployeesPage /> },
                  { path: ':employeeId', element: <EmployeeDetailsPage /> },
                ],
              },
              { path: 'leave-requests', element: <LeaveRequestsPage /> },
              { path: 'leave-types', element: <LeaveTypesPage /> },
            ],
          },
          {
            path: 'reports',
            children: [
              { index: true, element: <ReportsHubPage /> },
              { path: 'overview', element: <ReportsPage /> },
            ],
          },
          {
            path: 'admin',
            element: <AdminHubPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
