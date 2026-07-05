import { StatCard } from '../../components/ui/StatCard'

export function DashboardPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="page-description">Overview of your restaurant operations</p>
      </header>

      <div className="mini-stat-grid mini-stat-grid--compact">
        <StatCard title="Today Orders" value={42} helperText="All branches" dotVariant="primary" />
        <StatCard title="Today Sales" value="EGP 12,450" helperText="Gross sales" dotVariant="accent" />
        <StatCard title="Active Branches" value={3} dotVariant="success" />
        <StatCard title="Low Stock Items" value={7} helperText="Needs attention" dotVariant="warning" />
      </div>
    </div>
  )
}
