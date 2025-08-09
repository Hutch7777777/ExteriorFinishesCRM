import { useParams } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Calculator, LogOut } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { DivisionSwitcher } from '@/components/DivisionSwitcher'
import Customers from '@/pages/Customers'
import Jobs from '@/pages/Jobs'
import Estimates from '@/pages/Estimates'
import EditCustomer from '@/pages/EditCustomer'

// DIVISIONS constant removed - now fetched via tRPC

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
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      // Clear auth cache and redirect to sign in
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">
            Exterior Finishes CRM
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <DivisionSwitcher />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </Button>
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
      return <div className="text-center py-8 text-muted-foreground">Edit Job (Coming Soon)</div>
    }
    if (currentPath.includes('/estimates/edit/')) {
      return <div className="text-center py-8 text-muted-foreground">Edit Estimate (Coming Soon)</div>
    }

    // Handle main sections
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