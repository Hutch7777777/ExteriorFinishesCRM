import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { LogOut, Menu } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useSidebar } from '@/contexts/SidebarContext'

import { DivisionSwitcher } from '@/components/DivisionSwitcher'

export function Header() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { toggleSidebar } = useSidebar()

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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Menu toggle and App logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
          <img 
            src="/images/logo.svg" 
            alt="Exterior Finishes Logo" 
            className="h-8 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Exterior Finishes
            </h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">WHERE SERVICE & QUALITY MEET</p>
          </div>
        </div>
        
        {/* Center section - Division Switcher */}
        <div className="flex items-center">
          <DivisionSwitcher />
        </div>
        
        {/* Right section - User menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </header>
  )
}