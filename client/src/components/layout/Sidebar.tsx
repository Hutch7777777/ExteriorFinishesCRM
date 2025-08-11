import { useParams } from '@tanstack/react-router'
import { useSidebar } from '@/contexts/SidebarContext'
import { 
  Users, 
  Briefcase, 
  Calculator, 
  FileText,
  FileCheck,
  Trello,
  Building2,
  MessageSquare,
  BarChart3,
  UserCircle,
  Wrench,
  Brain
} from 'lucide-react'

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isCollapsed?: boolean
}

function NavLink({ href, icon, label, isActive, isCollapsed }: NavLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('NavLink clicked:', { href, label })
    // Force a full page navigation to ensure routing works
    window.location.href = href
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-[#4A6FA5] to-[#2C3E50] text-white shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-[#D4E4F7] dark:text-slate-400 dark:hover:text-slate-50 dark:hover:bg-slate-800'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
        {icon}
      </span>
      {!isCollapsed && <span className="font-medium">{label}</span>}
    </a>
  )
}

export function Sidebar() {
  const params = useParams({ strict: false })
  const currentDivision = (params as any)?.division || 'mfnc'
  const currentPath = window.location.pathname
  const { isCollapsed } = useSidebar()

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sidebar-shadow transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'}`}>
        {/* Core Business section */}
        <div className="mb-6">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Core Business
            </h2>
          )}
          <nav className="space-y-1">
            <NavLink
              href={`/${currentDivision}/lead-management`}
              icon={<Trello className="w-5 h-5" />}
              label="Lead Management"
              isActive={currentPath.includes('/lead-management')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/estimates`}
              icon={<Calculator className="w-5 h-5" />}
              label="Estimates"
              isActive={currentPath.includes('/estimates')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/customers`}
              icon={<Users className="w-5 h-5" />}
              label="Customers"
              isActive={currentPath.includes('/customers')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/field-management`}
              icon={<Wrench className="w-5 h-5" />}
              label="Field Management"
              isActive={currentPath.includes('/field-management')}
              isCollapsed={isCollapsed}
            />
          </nav>
        </div>

        {/* Tools section */}
        <div className="mb-6">
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Tools
            </h2>
          )}
          <nav className="space-y-1">
            <NavLink
              href={`/${currentDivision}/contacts`}
              icon={<Building2 className="w-5 h-5" />}
              label="Contacts"
              isActive={currentPath.includes('/contacts')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/communication`}
              icon={<MessageSquare className="w-5 h-5" />}
              label="Team Chat"
              isActive={currentPath.includes('/communication')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/reports`}
              icon={<BarChart3 className="w-5 h-5" />}
              label="Reports"
              isActive={currentPath.includes('/reports')}
              isCollapsed={isCollapsed}
            />
            <NavLink
              href={`/${currentDivision}/business-insight`}
              icon={<Brain className="w-5 h-5" />}
              label="Business Insight"
              isActive={currentPath.includes('/business-insight')}
              isCollapsed={isCollapsed}
            />
          </nav>
        </div>
      </div>
    </aside>
  )
}