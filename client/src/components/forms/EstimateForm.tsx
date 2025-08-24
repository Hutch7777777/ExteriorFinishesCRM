import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Job, type Lead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EstimateFormProps {
  onSuccess?: () => void;
  leadId: string;
  initialData?: Partial<any>;
  estimateId?: string;
}

function dollarsToCents(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const num = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]/g, ''));
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

function centsToDollars(value: number | string | undefined): string {
  if (value === undefined || value === null) return '';
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!Number.isFinite(n as number)) return '';
  return ((n as number) / 100).toFixed(2);
}

const estimateFormSchema = z.object({
  leadId: z.string().uuid({ message: 'Lead is required' }),
  jobId: z.string().uuid().optional().or(z.literal('')).transform(v => (v ? v : undefined)),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']).default('draft'),
  amountDollars: z.string().optional().default('0').transform(v => dollarsToCents(v)),
  laborHours: z.string().optional().default('0'),
  linesJsonText: z.string().optional().transform((txt) => {
    if (!txt || txt.trim() === '') return undefined;
    try {
      return JSON.parse(txt);
    } catch {
      throw new Error('Lines must be valid JSON');
    }
  }),
}).transform((data) => ({
  leadId: data.leadId,
  jobId: data.jobId,
  title: data.title,
  description: data.description || undefined,
  status: data.status,
  totalCents: data.amountDollars as unknown as number,
  laborHours: data.laborHours || '0',
  linesJson: data.linesJsonText,
}));

export default function EstimateForm({ onSuccess, leadId, initialData, estimateId }: EstimateFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: lead } = useQuery<Lead | null>({
    queryKey: ['/api/trpc/leads.get', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/trpc/leads.get?id=${leadId}`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.result?.json as Lead) ?? null;
    },
    enabled: !!leadId,
  });

  const form = useForm<z.input<typeof estimateFormSchema>>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: {
      leadId,
      jobId: initialData?.jobId ?? '',
      title: (initialData as any)?.title ?? '',
      description: (initialData as any)?.description ?? '',
      status: (initialData as any)?.status ?? 'draft',
      amountDollars: centsToDollars((initialData as any)?.totalCents),
      laborHours: (initialData as any)?.laborHours ?? '0',
      linesJsonText: (initialData as any)?.linesJson ? JSON.stringify((initialData as any).linesJson, null, 2) : '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.output<typeof estimateFormSchema>) => {
      if (estimateId) {
        return await apiRequest('PUT', `/api/estimates/${estimateId}`, data);
      }
      const res = await fetch('/api/trpc/estimates.create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to create estimate');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/estimates.list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trpc/estimates.getByLeadId', leadId] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "Success",
        description: `Estimate ${estimateId ? 'updated' : 'created'} successfully`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${estimateId ? 'update' : 'create'} estimate`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.output<typeof estimateFormSchema>) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {lead && (
          <div className="rounded-md border p-4 bg-slate-50 text-sm text-slate-700">
            <div className="font-medium">Lead</div>
            <div className="mt-1">{lead.name}</div>
            {lead.contact && <div>Contact: {lead.contact}</div>}
            {lead.email && <div>Email: {lead.email}</div>}
            {lead.phone && <div>Phone: {lead.phone}</div>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead *</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimate Title *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amountDollars"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total (USD) *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Job (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No related job</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.projectType || `Job ${job.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="laborHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Labor Hours</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linesJsonText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line Items (JSON)</FormLabel>
              <FormControl>
                <Textarea rows={6} placeholder='[{"item":"Labor","qty":10,"rate":50}]' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : estimateId ? 'Update Estimate' : 'Create Estimate'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
