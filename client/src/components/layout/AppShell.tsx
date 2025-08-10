import { useParams } from '@tanstack/react-router'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import Customers from '@/pages/Customers'
import Jobs from '@/pages/Jobs'
import Estimates from '@/pages/Estimates'
import Pipeline from '@/pages/Pipeline'
import Proposals from '@/pages/Proposals'
import Contracts from '@/pages/Contracts'
import Contacts from '@/pages/Contacts'
import Communication from '@/pages/Communication'
import Reports from '@/pages/Reports'
import EditCustomer from '@/pages/EditCustomer'

export default function AppShell() {
  const params = useParams({ strict: false })
  const division = (params as any).division || 'mfnc'
  const section = (params as any).section || 'customers'
  const currentPath = window.location.pathname

  // Render the appropriate component based on the route
  const renderContent = () => {
    // Handle edit routes
    if (currentPath.includes('/customers/edit/')) {
      return <EditCustomer />
    }
    if (currentPath.includes('/jobs/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Job (Coming Soon)</div>
    }
    if (currentPath.includes('/estimates/edit/')) {
      return <div className="text-center py-8 text-slate-500">Edit Estimate (Coming Soon)</div>
    }

    // Handle main sections
    switch (section) {
      case 'customers':
        return <Customers />
      case 'jobs':
        return <Jobs />
      case 'estimates':
        return <Estimates />
      case 'pipeline':
        return <Pipeline />
      case 'proposals':
        return <Proposals />
      case 'contracts':
        return <Contracts />
      case 'contacts':
        return <Contacts />
      case 'communication':
        return <Communication />
      case 'reports':
        return <Reports />
      default:
        return <Customers />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}