import { useParams } from '@tanstack/react-router'
import { Users, Briefcase, Calculator } from 'lucide-react'

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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </a>
  )
}

export function Sidebar() {
  const params = useParams({ strict: false })
  const currentDivision = (params as any)?.division || 'mfnc'
  const currentPath = window.location.pathname

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sidebar-shadow">
      <div className="p-6">
        {/* Navigation section */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Navigation
          </h2>
          <nav className="space-y-1">
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
        </div>
      </div>
    </aside>
  )
}