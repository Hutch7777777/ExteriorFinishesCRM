import { Link, useLocation } from "wouter";
import { Home, Users, Briefcase, Calculator, Building, House, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Estimates", href: "/estimates", icon: Calculator },
];

const divisions = [
  { name: "Residential", href: "/division/residential", icon: House },
  { name: "Commercial", href: "/division/commercial", icon: Building },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 shadow-2xl z-40">
      {/* Logo and Company Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-lg">Exterior Finishes</h1>
          <p className="text-slate-400 text-sm">CRM Dashboard</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-white bg-blue-600"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  )}>
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
          
          <li className="pt-4">
            <div className="px-3 py-2 text-slate-500 text-sm font-medium uppercase tracking-wider">
              Divisions
            </div>
          </li>
          
          {divisions.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "text-white bg-blue-600"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  )}>
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-slate-300 text-sm font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-400 text-xs truncate">Project Manager</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
