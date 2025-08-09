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

  // Fetch divisions using tRPC
  const { data: divisions, isLoading } = useQuery<Division[]>({
    queryKey: ['divisions.getAll'],
    queryFn: () => trpcClient.divisions.getAll(),
    retry: false,
  });

  const handleDivisionChange = (newDivisionKey: string) => {
    // Navigate to the new division while preserving the current section
    navigate({ to: `/${newDivisionKey}/${currentSection}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Division:
        </label>
        <div className="w-64 h-10 bg-muted rounded-md animate-pulse" />
      </div>
    );
  }

  if (!divisions || divisions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Division:
        </label>
        <div className="text-sm text-muted-foreground">No divisions available</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="division-select" className="text-sm font-medium text-muted-foreground">
        Division:
      </label>
      <Select value={currentDivision} onValueChange={handleDivisionChange}>
        <SelectTrigger id="division-select" className="w-64">
          <SelectValue placeholder="Select division" />
        </SelectTrigger>
        <SelectContent>
          {divisions.map((division) => (
            <SelectItem key={division.key} value={division.key}>
              {division.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}