import { useParams } from '@tanstack/react-router'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Briefcase, Calculator } from 'lucide-react'
import Customers from '@/pages/Customers'
import Jobs from '@/pages/Jobs'
import Estimates from '@/pages/Estimates'

const DIVISIONS = {
  mfnc: 'Multi-Family New Construction',
  sfnc: 'Single-Family New Construction', 
  rr: 'Repair & Renovation'
}

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  )
}

function Header() {
  const params = useParams({ strict: false })
  const currentDivision = params.division || 'mfnc'
  const currentPath = window.location.pathname
  const currentSection = currentPath.split('/').pop() || 'customers'

  const handleDivisionChange = (newDivision: string) => {
    window.location.href = `/${newDivision}/${currentSection}`
  }

  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            Exterior Finishes CRM
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="division-select" className="text-sm font-medium text-muted-foreground">
              Division:
            </label>
            <Select value={currentDivision} onValueChange={handleDivisionChange}>
              <SelectTrigger id="division-select" className="w-64">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIVISIONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <a
            href="/api/logout"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </a>
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  const params = useParams({ strict: false })
  const currentDivision = params.division || 'mfnc'
  const currentPath = window.location.pathname

  return (
    <aside className="w-64 bg-card border-r">
      <nav className="p-4 space-y-2">
        <NavLink
          href={`/${currentDivision}/customers`}
          icon={<Users className="w-5 h-5" />}
          label="Customers"
          isActive={currentPath.includes('/customers')}
        />
        <NavLink
          href={`/${currentDivision}/jobs`}
          icon={<Briefcase className="w-5 h-5" />}
          label="Jobs"
          isActive={currentPath.includes('/jobs')}
        />
        <NavLink
          href={`/${currentDivision}/estimates`}
          icon={<Calculator className="w-5 h-5" />}
          label="Estimates"
          isActive={currentPath.includes('/estimates')}
        />
      </nav>
    </aside>
  )
}

export default function AppShell() {
  const params = useParams({ strict: false })
  const section = params.section || 'customers'

  // Render the appropriate component based on the section
  const renderContent = () => {
    switch (section) {
      case 'customers':
        return <Customers />
      case 'jobs':
        return <Jobs />
      case 'estimates':
        return <Estimates />
      default:
        return <Customers />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}