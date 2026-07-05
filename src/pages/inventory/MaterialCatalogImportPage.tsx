import { Navigate } from 'react-router-dom'

/** Legacy route — catalog import is opened as a modal from setup or materials. */
export function MaterialCatalogImportPage() {
  return <Navigate to="/inventory/materials?catalog=1" replace />
}
