import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { LocaleProvider } from './i18n/LocaleProvider'
import './App.css'
import './styles/list-system.css'
import './styles/sidebar-polish.css'
import './styles/entity-details.css'
import './styles/fields.css'
import './styles/entity-detail-page.css'
import './styles/inventory.css'
import './styles/assets.css'
import './styles/menu.css'
import './styles/hub.css'
import './styles/orders.css'
import './styles/devices.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  </StrictMode>,
)
