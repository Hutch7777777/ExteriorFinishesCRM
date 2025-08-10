import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpcClient } from '@/lib/trpc';

interface Division {
  id: string;
  key: 'mfnc' | 'sfnc' | 'rr';
  name: string;
}

export function DivisionSwitcher() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const currentDivision = (params as any).division || 'mfnc';
  const currentSection = (params as any).section || 'customers';

  // Fetch divisions using tRPC with optimized caching
  const { data: divisions, isLoading } = useQuery<Division[]>({
    queryKey: ['divisions.getAll'],
    queryFn: () => trpcClient.divisions.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - divisions rarely change
    cacheTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const handleDivisionChange = (newDivisionKey: string) => {
    // Navigate to the new division while preserving the current section
    navigate({ to: `/${newDivisionKey}/${currentSection}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Division:
        </label>
        <div className="w-48 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!divisions || divisions.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Division:
        </label>
        <div className="text-sm text-slate-500">No divisions available</div>
      </div>
    );
  }

  const currentDivisionData = divisions.find(d => d.key === currentDivision);

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="division-select" className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Division:
      </label>
      <Select value={currentDivision} onValueChange={handleDivisionChange}>
        <SelectTrigger 
          id="division-select" 
          className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <SelectValue placeholder="Select division" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          {divisions.map((division) => (
            <SelectItem 
              key={division.key} 
              value={division.key}
              className="hover:bg-slate-50 dark:hover:bg-slate-700 focus:bg-slate-50 dark:focus:bg-slate-700"
            >
              {division.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}