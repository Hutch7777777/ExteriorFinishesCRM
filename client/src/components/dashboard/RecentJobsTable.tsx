import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { JobWithRelations } from "@shared/schema";

interface RecentJobsTableProps {
  jobs: JobWithRelations[];
  isLoading?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'planning':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function RecentJobsTable({ jobs, isLoading }: RecentJobsTableProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Jobs</CardTitle>
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Project Type
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-slate-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600">
                            {job.customer ? getInitials(job.customer.name) : '--'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {job.customer?.name || 'Unknown Customer'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {job.customer?.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{job.projectType}</td>
                    <td className="py-4 px-6">
                      <Badge className={getStatusColor(job.status)}>
                        {formatStatus(job.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {job.value ? `$${Number(job.value).toLocaleString()}` : '--'}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
