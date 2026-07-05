# Restaurant SAAS Web

React 19 + TypeScript frontend for the Restaurant SAAS platform.

## Stack

- **React 19**, **TypeScript**, **Vite 8**
- **React Router v7** — client routing
- **Axios** — API client with auth + tenant headers
- **Lucide React** — icons
- Plain **CSS** (BEM-style), CSS variables for theming
- **i18n** — English + Arabic with full RTL support

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard / Home | `/dashboard` | Hub landing |
| Menu | `/menu` | Categories, products, recipes |
| Sales | `/sales` | Sales hub |
| Inventory | `/inventory` | Materials, warehouses, stock ops |
| Purchasing | `/purchase` | Suppliers, invoices, returns |
| HR | `/hr` | Employees, jobs, leave |
| Reports | `/reports` | Reports hub |
| Admin | `/admin` | Branches, users, settings |

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev            # http://localhost:5188
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 5188) |
| `npm run build` | Typecheck + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8080`) |

Backend repo: `restaurant-saas` (Spring Boot).
