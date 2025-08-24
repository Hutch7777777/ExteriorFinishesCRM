import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Job, type Lead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import { z } from "zod";

interface EstimateFormProps {
  onSuccess?: () => void;
  leadId: string;
  initialData?: Partial<any>;
  estimateId?: string;
}

function centsToDollars(value: number | string | undefined): string {
  if (value === undefined || value === null) return '';
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!Number.isFinite(n as number)) return '';
  return ((n as number) / 100).toFixed(2);
}

export const EstimateSchema = z.object({
  leadId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED']),
  totalDollars: z
    .string()
    .trim()
    .refine(v => v !== '' && !isNaN(Number(v)), 'Enter a valid amount'),
  laborHours: z.number().int().nonnegative().optional(),
  linesJson: z
    .array(
      z.object({
        label: z.string().min(1),
        qty: z.number().positive(),
        unit: z.string().min(1),
        unitCents: z.number().int().nonnegative(),
      })
    )
    .default([]),
}).transform(v => {
  const totalCents = Math.round(Number(v.totalDollars) * 100);
  const status = v.status.toLowerCase() as 'draft' | 'sent' | 'approved' | 'rejected';
  return {
    leadId: v.leadId,
    jobId: v.jobId,
    title: v.title,
    description: v.description,
    status,
    totalCents,
    laborHours: v.laborHours,
    linesJson: v.linesJson,
  };
});

export type EstimateFormInput = z.input<typeof EstimateSchema>;
export type EstimateInsert = z.output<typeof EstimateSchema>;

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

  useEffect(() => {
    if (!leadId) {
      toast({
        title: "Missing lead",
        description: "A valid lead is required to create an estimate.",
        variant: "destructive",
      });
      return;
    }
    if (lead === null) {
      toast({
        title: "Lead not found",
        description: "Unable to load lead details. Please verify the link or try again.",
        variant: "destructive",
      });
    }
  }, [leadId, lead, toast]);

  const form = useForm<EstimateFormInput>({
    resolver: zodResolver(EstimateSchema),
    defaultValues: {
      leadId,
      jobId: (initialData as any)?.jobId,
      title: (initialData as any)?.title ?? '',
      description: (initialData as any)?.description ?? '',
      status: ((initialData as any)?.status ? String((initialData as any).status).toUpperCase() : 'DRAFT') as any,
      totalDollars: centsToDollars((initialData as any)?.totalCents),
      laborHours: (initialData as any)?.laborHours !== undefined ? Number((initialData as any).laborHours) : undefined,
      linesJson: (initialData as any)?.linesJson ?? [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: EstimateInsert) => {
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

  const onSubmit = (data: EstimateInsert) => {
    if (!data.leadId || lead === null) {
      toast({
        title: "Missing or invalid lead",
        description: "A valid lead is required to create an estimate.",
        variant: "destructive",
      });
      return;
    }
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
            {(lead as any).projectType && <div>Project: {(lead as any).projectType}</div>}
            {(lead as any).timeline && <div>Timeline: {(lead as any).timeline}</div>}
            {(lead as any).budget && <div>Budget: {(lead as any).budget}</div>}
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
            name="totalDollars"
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
                <Select onValueChange={field.onChange} defaultValue={field.value as any}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value as any}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  <Input type="number" step="1" min="0" placeholder="0" {...field} />
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
          name="linesJson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Line Items (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  value={JSON.stringify(field.value ?? [], null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      field.onChange(parsed);
                    } catch {
                      // ignore invalid JSON until submit
                    }
                  }}
                  placeholder='[{"label":"Labor","qty":10,"unit":"hr","unitCents":5000}]'
                />
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
