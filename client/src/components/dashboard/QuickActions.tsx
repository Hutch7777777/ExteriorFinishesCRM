import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus, Calculator } from "lucide-react";

interface QuickActionsProps {
  onCreateCustomer?: () => void;
  onCreateJob?: () => void;
  onCreateEstimate?: () => void;
}

export default function QuickActions({ 
  onCreateCustomer, 
  onCreateJob, 
  onCreateEstimate 
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto p-3"
          onClick={onCreateCustomer}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900">Add Customer</p>
              <p className="text-sm text-slate-500">Create new customer record</p>
            </div>
          </div>
        </Button>

        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto p-3"
          onClick={onCreateJob}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900">New Job</p>
              <p className="text-sm text-slate-500">Start a new project</p>
            </div>
          </div>
        </Button>

        <Button 
          variant="ghost" 
          className="w-full justify-start h-auto p-3"
          onClick={onCreateEstimate}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900">Create Estimate</p>
              <p className="text-sm text-slate-500">Generate project quote</p>
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
