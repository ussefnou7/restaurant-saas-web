export function PosPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>POS</h1>
        <p className="page-description">Start and manage cashier orders</p>
      </header>

      <div className="pos-layout">
        <section className="pos-main">
          <div className="pos-toolbar">
            <button type="button" className="button-secondary pos-action-btn">
              Categories
            </button>
            <button type="button" className="button-primary pos-action-btn">
              Products
            </button>
          </div>
          <div className="card pos-menu-placeholder">
            <p className="empty-state">Menu and products will appear here</p>
          </div>
        </section>

        <aside className="pos-sidebar">
          <div className="card pos-order-card">
            <h2 className="pos-panel-title">Current Order</h2>
            <p className="empty-state">No items in the order yet</p>
          </div>
          <button type="button" className="button-primary pos-pay-btn">
            Pay
          </button>
        </aside>
      </div>
    </div>
  )
}
