import { useState } from "react";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onCreateCustomer?: () => void;
  onCreateJob?: () => void;
  onCreateEstimate?: () => void;
}

export default function Header({ 
  title, 
  subtitle, 
  onCreateCustomer, 
  onCreateJob, 
  onCreateEstimate 
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Implement search functionality
    console.log("Search query:", value);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          {subtitle && (
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search customers, jobs..."
              className="w-80 pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* Add New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onCreateCustomer && (
                <DropdownMenuItem onClick={onCreateCustomer}>
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </DropdownMenuItem>
              )}
              {onCreateJob && (
                <DropdownMenuItem onClick={onCreateJob}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Create Job
                </DropdownMenuItem>
              )}
              {onCreateEstimate && (
                <DropdownMenuItem onClick={onCreateEstimate}>
                  <Calculator className="h-4 w-4 mr-2" />
                  New Estimate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
