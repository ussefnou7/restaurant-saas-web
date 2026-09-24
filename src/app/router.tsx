import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Root } from './Root'
import { ProtectedRoute } from '../guards/ProtectedRoute'
import { ScreenGuard } from '../guards/ScreenGuard'
import { ClientLayout } from '../layouts/ClientLayout'
import { AssetDetailPage } from '../pages/assets/AssetDetailPage'
import { AssetDisposalsPage } from '../pages/assets/AssetDisposalsPage'
import { AssetMaintenanceListPage } from '../pages/assets/AssetMaintenanceListPage'
import { AssetDisposalPage, AssetMaintenancePage } from '../pages/assets/AssetOperationForms'
import { AssetsHubPage } from '../pages/assets/AssetsHubPage'
import { AssetsListPage } from '../pages/assets/AssetsListPage'
import { AssetsReportPage } from '../pages/assets/AssetsReportPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { BranchDetailsPage } from '../pages/branches/BranchDetailsPage'
import { BranchesPage } from '../pages/branches/BranchesPage'
import { MenuHubLayout } from '../pages/menu/MenuHubLayout'
import { MenuCategoriesSection } from '../pages/menu/MenuCategoriesSection'
import { ProductEditorPage } from '../pages/menu/ProductEditorPage'
import { MenuProductsSection } from '../pages/menu/MenuProductsSection'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { DevicesPage } from '../pages/devices/DevicesPage'
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
import { MaterialDetailsPage } from '../pages/inventory/MaterialDetailsPage'
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
import { PhysicalCountsPage } from '../pages/inventory/physical-counts/PhysicalCountsPage'
import { PhysicalCountCreatePage, PhysicalCountViewPage } from '../pages/inventory/physical-counts/PhysicalCountFormPage'
import { WasteDocumentCreatePage } from '../pages/inventory/waste-documents/WasteDocumentCreatePage'
import { WasteDocumentDetailPage } from '../pages/inventory/waste-documents/WasteDocumentDetailPage'
import { WasteDocumentsPage } from '../pages/inventory/waste-documents/WasteDocumentsPage'
import { OrderConsumptionListPage } from '../pages/inventory/order-consumption/OrderConsumptionListPage'
import { OrderConsumptionDetailPage } from '../pages/inventory/order-consumption/OrderConsumptionDetailPage'
import { LossComparisonReport } from '../pages/inventory/reports/LossComparisonReport'
import { LowStockReport } from '../pages/inventory/reports/LowStockReport'
import { PurchasePriceDriftReport } from '../pages/inventory/reports/PurchasePriceDriftReport'
import { ReportsHub } from '../pages/inventory/reports/ReportsHub'
import { ShrinkageReport } from '../pages/inventory/reports/ShrinkageReport'
import { StockValuationReport } from '../pages/inventory/reports/StockValuationReport'
import { WasteAnalysisReport } from '../pages/inventory/reports/WasteAnalysisReport'
import { SalesByHourReport } from '../pages/sales/reports/SalesByHourReport'
import { SalesByPaymentMethodReport } from '../pages/sales/reports/SalesByPaymentMethodReport'
import { SalesByProductReport } from '../pages/sales/reports/SalesByProductReport'
import { SalesOverTimeReport } from '../pages/sales/reports/SalesOverTimeReport'
import { SalesReportsHub } from '../pages/sales/reports/SalesReportsHub'
import { NotFoundPage } from '../pages/NotFoundPage'
import { CustomersListSection } from '../pages/orders/CustomersListSection'
import { OrderDetailPage } from '../pages/orders/OrderDetailPage'
import { OrderRequestDetailPage } from '../pages/orders/OrderRequestDetailPage'
import { OrderRequestsListSection } from '../pages/orders/OrderRequestsListSection'
import { OrdersHubLayout } from '../pages/orders/OrdersHubLayout'
import { OrdersListSection } from '../pages/orders/OrdersListSection'
import { PosPage } from '../pages/pos/PosPage'
import { ReportsCataloguePage } from '../pages/reports/ReportsCataloguePage'
import { SettingsPage } from '../pages/settings/SettingsPage'
import { ShiftDetailPage } from '../pages/shifts/ShiftDetailPage'
import { ShiftsListPage } from '../pages/shifts/ShiftsListPage'
import { TableLayoutPage } from '../pages/tables/TableLayoutPage'
import { TablesListPage } from '../pages/tables/TablesListPage'
import { UserDetailsPage } from '../pages/users/UserDetailsPage'
import { UsersPage } from '../pages/users/UsersPage'
import { EmployeeDetailsPage } from '../pages/hr/employees/EmployeeDetailsPage'
import { ExpensesListPage } from '../pages/expenses/ExpensesListPage'
import { ExpenseCreatePage } from '../pages/expenses/ExpenseCreatePage'
import { ExpenseDetailPage } from '../pages/expenses/ExpenseDetailPage'
import { ExpenseCategoriesPage } from '../pages/expenses/ExpenseCategoriesPage'

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
        handle: { titleKey: 'auth.login.screenTitle' },
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
            handle: { titleKey: 'hubs.home.title' },
            children: [
              { index: true, element: <HomeHubPage /> },
              { path: 'overview', element: <DashboardPage />, handle: { titleKey: 'layout.nav.dashboard' } },
            ],
          },
          {
            path: 'sales',
            element: <ScreenGuard screen="sales" />,
            handle: { titleKey: 'hubs.sales.title' },
            children: [
              { index: true, element: <SalesHubPage /> },
              {
                path: 'reports',
                handle: { titleKey: 'reports.salesHub.title' },
                children: [
                  { index: true, element: <SalesReportsHub /> },
                  { path: 'sales-over-time', element: <SalesOverTimeReport />, handle: { titleKey: 'reports.salesOverTime' } },
                  { path: 'sales-by-hour', element: <SalesByHourReport />, handle: { titleKey: 'reports.salesByHour' } },
                  { path: 'sales-by-product', element: <SalesByProductReport />, handle: { titleKey: 'reports.salesByProduct' } },
                  { path: 'sales-by-payment-method', element: <SalesByPaymentMethodReport />, handle: { titleKey: 'reports.salesByPaymentMethod' } },
                ],
              },
            ],
          },
          {
            path: 'pos',
            element: <PosPage />,
            handle: { titleKey: 'layout.nav.pos' },
          },
          {
            path: 'orders',
            element: <ScreenGuard screen="orders" />,
            handle: { titleKey: 'orders.title' },
            children: [
              {
                element: <OrdersHubLayout />,
                children: [
                  { index: true, element: <Navigate to="list" replace /> },
                  { path: 'list', element: <OrdersListSection />, handle: { titleKey: 'orders.list.title' } },
                  { path: 'order-requests', element: <OrderRequestsListSection />, handle: { titleKey: 'orders.requests.title' } },
                  { path: 'customers', element: <CustomersListSection />, handle: { titleKey: 'customers.title' } },
                ],
              },
              { path: 'requests/:requestId', element: <OrderRequestDetailPage />, handle: { titleKey: 'orders.requests.detailTitle' } },
              { path: ':orderId', element: <OrderDetailPage />, handle: { titleKey: 'orders.detail.screenTitle' } },
            ],
          },
          {
            path: 'shifts',
            element: <ScreenGuard screen="shifts" />,
            handle: { titleKey: 'shifts.title' },
            children: [
              { index: true, element: <ShiftsListPage /> },
              { path: ':shiftId', element: <ShiftDetailPage />, handle: { titleKey: 'shifts.detail.screenTitle' } },
            ],
          },
          {
            path: 'menu',
            element: <ScreenGuard screen="menu"><MenuHubLayout /></ScreenGuard>,
            handle: { titleKey: 'hubs.menu.title' },
            children: [
              { index: true, element: <Navigate to="/menu/categories" replace /> },
              { path: 'categories', element: <MenuCategoriesSection />, handle: { titleKey: 'menu.categories.title' } },
              { path: 'products', element: <MenuProductsSection />, handle: { titleKey: 'menu.products.title' } },
              { path: 'products/new', element: <ProductEditorPage />, handle: { titleKey: 'menu.products.new' } },
              { path: 'products/:id/edit', element: <ProductEditorPage />, handle: { titleKey: 'menu.products.edit' } },
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
            element: <ScreenGuard screen="branches" />,
            handle: { titleKey: 'branches.title' },
            children: [
              { index: true, element: <BranchesPage /> },
              { path: ':branchId', element: <BranchDetailsPage />, handle: { titleKey: 'branchDetails.title' } },
            ],
          },
          {
            path: 'devices',
            element: <ScreenGuard screen="devices"><DevicesPage /></ScreenGuard>,
            handle: { titleKey: 'devices.title' },
          },
          {
            path: 'tables',
            element: <ScreenGuard screen="tables" />,
            handle: { titleKey: 'tables.title' },
            children: [
              { index: true, element: <TablesListPage /> },
              { path: 'layout', element: <TableLayoutPage />, handle: { titleKey: 'tables.layout.title' } },
            ],
          },
          {
            path: 'inventory',
            element: <ScreenGuard screen="inventory" />,
            handle: { titleKey: 'hubs.inventory.title' },
            children: [
              {
                index: true,
                element: <InventoryHubPage />,
              },
              {
                path: 'setup',
                element: <InventorySetupPage />,
                handle: { titleKey: 'inventory.setup.title' },
              },
              {
                path: 'catalog-import',
                element: <MaterialCatalogImportPage />,
                handle: { titleKey: 'inventory.catalogImport.title' },
              },
              {
                path: 'materials',
                handle: { titleKey: 'inventory.materials.title' },
                children: [
                  { index: true, element: <MaterialsPage /> },
                  { path: 'new', element: <MaterialDetailsPage />, handle: { titleKey: 'inventory.materials.new' } },
                  { path: ':materialId', element: <MaterialDetailsPage />, handle: { titleKey: 'inventory.materials.details' } },
                  { path: ':materialId/edit', element: <MaterialDetailsPage />, handle: { titleKey: 'inventory.materials.edit' } },
                ],
              },
              {
                path: 'material-categories',
                element: <MaterialCategoriesPage />,
                handle: { titleKey: 'inventory.categories.title' },
              },
              {
                path: 'warehouses',
                handle: { titleKey: 'inventory.warehouses.title' },
                children: [
                  { index: true, element: <WarehousesPage /> },
                  { path: ':warehouseId', element: <WarehouseDetailsPage />, handle: { titleKey: 'inventory.warehouses.details' } },
                ],
              },
              {
                path: 'settings/uom',
                element: <TenantUomPage />,
                handle: { titleKey: 'inventory.adminUoms.title' },
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
                path: 'physical-counts',
                handle: { titleKey: 'inventory.physicalCounts.title' },
                children: [
                  { index: true, element: <PhysicalCountsPage /> },
                  { path: 'new', element: <PhysicalCountCreatePage />, handle: { titleKey: 'inventory.physicalCounts.new' } },
                  { path: ':id', element: <PhysicalCountViewPage />, handle: { titleKey: 'inventory.physicalCounts.details' } },
                ],
              },
              {
                path: 'waste-documents',
                handle: { titleKey: 'inventory.waste.title' },
                children: [
                  { index: true, element: <WasteDocumentsPage /> },
                  { path: 'new', element: <WasteDocumentCreatePage />, handle: { titleKey: 'inventory.waste.new' } },
                  { path: ':id', element: <WasteDocumentDetailPage />, handle: { titleKey: 'inventory.waste.details' } },
                ],
              },
              {
                path: 'order-consumption',
                handle: { titleKey: 'orderConsumption.list.title' },
                children: [
                  { index: true, element: <OrderConsumptionListPage /> },
                  { path: ':id', element: <OrderConsumptionDetailPage />, handle: { titleKey: 'orderConsumption.detail.title' } },
                ],
              },
              {
                path: 'stock-balances',
                element: <StockBalancesPage />,
                handle: { titleKey: 'inventory.stock.balances.title' },
              },
              {
                path: 'transactions',
                element: <InventoryTransactionsPage />,
                handle: { titleKey: 'inventory.stock.transactions.title' },
              },
              {
                path: 'reports',
                handle: { titleKey: 'reports.hub.title' },
                children: [
                  { index: true, element: <ReportsHub /> },
                  { path: 'stock-valuation', element: <StockValuationReport />, handle: { titleKey: 'reports.stockValuation' } },
                  { path: 'low-stock', element: <LowStockReport />, handle: { titleKey: 'reports.lowStock' } },
                  { path: 'shrinkage', element: <ShrinkageReport />, handle: { titleKey: 'reports.shrinkage' } },
                  { path: 'waste-analysis', element: <WasteAnalysisReport />, handle: { titleKey: 'reports.wasteAnalysis' } },
                  { path: 'loss-comparison', element: <LossComparisonReport />, handle: { titleKey: 'reports.lossComparison' } },
                  { path: 'purchase-price-drift', element: <PurchasePriceDriftReport />, handle: { titleKey: 'reports.purchasePriceDrift' } },
                ],
              },
              {
                path: 'admin',
                handle: { titleKey: 'hubs.inventory.admin.title' },
                children: [
                  {
                    index: true,
                    element: <Navigate to="/inventory/admin/uoms" replace />,
                  },
                  { path: 'uoms', element: <AdminUomsPage />, handle: { titleKey: 'inventory.adminUoms.title' } },
                  {
                    path: 'material-categories',
                    element: <AdminMaterialCategoriesPage />,
                    handle: { titleKey: 'inventory.adminCategories.title' },
                  },
                  { path: 'material-catalog', element: <AdminMaterialCatalogPage />, handle: { titleKey: 'inventory.adminCatalog.title' } },
                  { path: 'seed', element: <InventorySeedPage />, handle: { titleKey: 'inventory.admin.seed.title' } },
                ],
              },
            ],
          },
          {
            path: 'assets',
            element: <ScreenGuard screen="assets" />,
            handle: { titleKey: 'assets.title' },
            children: [
              { index: true, element: <AssetsHubPage /> },
              { path: 'list', element: <AssetsListPage />, handle: { titleKey: 'assets.list.title' } },
              { path: 'new', element: <AssetDetailPage />, handle: { titleKey: 'assets.form.createTitle' } },
              { path: 'reports', element: <AssetsReportPage />, handle: { titleKey: 'assets.reports.title' } },
              { path: 'disposals', element: <AssetDisposalsPage />, handle: { titleKey: 'assets.disposals.title' } },
              { path: 'maintenance', element: <AssetMaintenanceListPage />, handle: { titleKey: 'assets.maintenanceList.title' } },
              { path: 'disposals/new', element: <AssetDisposalPage />, handle: { titleKey: 'assets.disposal.title' } },
              { path: 'maintenance/new', element: <AssetMaintenancePage />, handle: { titleKey: 'assets.maintenance.title' } },
              { path: ':assetId', element: <AssetDetailPage />, handle: { titleKey: 'assets.detail.title' } },
            ],
          },
          {
            path: 'purchase',
            element: <ScreenGuard screen="purchase" />,
            handle: { titleKey: 'hubs.purchase.title' },
            children: [
              { index: true, element: <PurchaseHubPage /> },
              { path: 'suppliers', element: <SuppliersPage />, handle: { titleKey: 'inventory.suppliers.title' } },
              {
                path: 'purchase-invoices',
                handle: { titleKey: 'inventory.purchaseInvoices.title' },
                children: [
                  { index: true, element: <PurchaseInvoicesPage /> },
                  { path: 'new', element: <PurchaseInvoiceCreatePage />, handle: { titleKey: 'inventory.purchaseInvoices.new' } },
                  { path: ':id/edit', element: <PurchaseInvoiceEditPage />, handle: { titleKey: 'inventory.purchaseInvoices.edit' } },
                  { path: ':id', element: <PurchaseInvoiceViewPage />, handle: { titleKey: 'inventory.purchaseInvoices.details' } },
                ],
              },
              {
                path: 'purchase-returns',
                handle: { titleKey: 'inventory.purchaseReturns.title' },
                children: [
                  { index: true, element: <PurchaseReturnsPage /> },
                  { path: 'new', element: <PurchaseReturnCreatePage />, handle: { titleKey: 'inventory.purchaseReturns.new' } },
                  { path: ':id', element: <PurchaseReturnViewPage />, handle: { titleKey: 'inventory.purchaseReturns.details' } },
                ],
              },
            ],
          },
          {
            path: 'expenses',
            element: <ScreenGuard screen="expenses" />,
            handle: { titleKey: 'expenses.title' },
            children: [
              { index: true, element: <ExpensesListPage /> },
              {
                path: 'new',
                element: <ExpenseCreatePage />,
                handle: { titleKey: 'expenses.create.title' },
              },
              {
                path: 'categories',
                element: <ExpenseCategoriesPage />,
                handle: { titleKey: 'expenses.categories.title' },
              },
              {
                path: ':id',
                element: <ExpenseDetailPage />,
                handle: { titleKey: 'expenses.detail.title' },
              },
            ],
          },
          {
            path: 'materials',
            element: <Navigate to="/inventory/materials" replace />,
          },
          {
            path: 'users',
            element: <ScreenGuard screen="users" />,
            handle: { titleKey: 'users.title' },
            children: [
              { index: true, element: <UsersPage /> },
              { path: ':userId', element: <UserDetailsPage />, handle: { titleKey: 'userDetails.title' } },
            ],
          },
          {
            path: 'hr',
            element: <ScreenGuard screen="hr" />,
            handle: { titleKey: 'hubs.hr.title' },
            children: [
              { index: true, element: <HrHubPage /> },
              { path: 'jobs', element: <JobsPage />, handle: { titleKey: 'jobs.title' } },
              {
                path: 'employees',
                handle: { titleKey: 'employees.title' },
                children: [
                  { index: true, element: <EmployeesPage /> },
                  { path: ':employeeId', element: <EmployeeDetailsPage />, handle: { titleKey: 'employees.details.title' } },
                ],
              },
              { path: 'leave-requests', element: <LeaveRequestsPage />, handle: { titleKey: 'leaveRequests.title' } },
              { path: 'leave-types', element: <LeaveTypesPage />, handle: { titleKey: 'leaveTypes.title' } },
            ],
          },
          {
            path: 'reports',
            handle: { titleKey: 'reports.title' },
            children: [
              { index: true, element: <ReportsCataloguePage /> },
              { path: 'catalogue', element: <ReportsCataloguePage />, handle: { titleKey: 'reports.catalogue.title' } },
              { path: 'overview', element: <ReportsCataloguePage />, handle: { titleKey: 'reports.catalogue.title' } },
              { path: 'hub', element: <ReportsHubPage />, handle: { titleKey: 'reports.hub.title' } },
            ],
          },
          {
            path: 'admin',
            element: <AdminHubPage />,
            handle: { titleKey: 'hubs.admin.title' },
          },
          {
            path: 'settings',
            element: <SettingsPage />,
            handle: { titleKey: 'layout.nav.settings' },
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: { titleKey: 'common.notFound' },
      },
    ],
  },
])
