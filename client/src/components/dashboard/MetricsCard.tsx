import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
    label: string;
  };
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export default function MetricsCard({ 
  label, 
  value, 
  change, 
  icon: Icon, 
  iconColor 
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (label.toLowerCase().includes('revenue') || label.toLowerCase().includes('value')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(val);
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-3xl font-semibold text-slate-900 mt-2">
              {formatValue(value)}
            </p>
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        {change && (
          <div className="flex items-center mt-4 text-sm">
            <span className={cn(
              "flex items-center gap-1",
              change.type === 'increase' ? "text-green-600" : 
              change.type === 'decrease' ? "text-red-600" : "text-amber-600"
            )}>
              {change.type === 'increase' && <TrendingUp className="w-4 h-4" />}
              {change.type === 'decrease' && <TrendingDown className="w-4 h-4" />}
              {change.type === 'neutral' && <Clock className="w-4 h-4" />}
              {change.value}
            </span>
            <span className="text-slate-500 ml-2">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
