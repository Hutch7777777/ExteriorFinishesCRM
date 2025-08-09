import superjson from 'superjson';

// Custom tRPC-like client that works with React Query
export class TRPCClient {
  private baseUrl = '/api/trpc';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.result ? superjson.deserialize(data.result) : data;
  }

  // Health endpoint
  health = {
    check: () => this.makeRequest('health.check'),
  };

  // Auth endpoints
  auth = {
    me: () => this.makeRequest('auth.me'),
    register: (input: any) => this.makeRequest('auth.register', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  };

  // Customers endpoints
  customers = {
    list: (input: { divisionKey?: string; q?: string; page?: number } = {}) => {
      const params = new URLSearchParams();
      if (input.divisionKey) params.set('divisionKey', input.divisionKey);
      if (input.q) params.set('q', input.q);
      if (input.page) params.set('page', input.page.toString());
      return this.makeRequest(`customers.list?${params}`);
    },
    getById: (input: { id: string }) => {
      const params = new URLSearchParams(input);
      return this.makeRequest(`customers.getById?${params}`);
    },
    create: (input: {
      divisionKey: 'mfnc' | 'sfnc' | 'rr';
      name: string;
      email?: string;
      phone?: string;
      addressJson?: any;
      notes?: string;
    }) => this.makeRequest('customers.create', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
    update: (input: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      addressJson?: any;
      notes?: string;
    }) => this.makeRequest('customers.update', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  };

  // Jobs endpoints
  jobs = {
    list: (input: { divisionKey?: 'mfnc' | 'sfnc' | 'rr'; status?: 'planning' | 'in_progress' | 'completed'; page?: number } = {}) => {
      const params = new URLSearchParams();
      if (input.divisionKey) params.set('divisionKey', input.divisionKey);
      if (input.status) params.set('status', input.status);
      if (input.page) params.set('page', input.page.toString());
      return this.makeRequest(`jobs.list?${params}`);
    },
    create: (input: {
      customerId: string;
      divisionKey: 'mfnc' | 'sfnc' | 'rr';
      status?: 'planning' | 'in_progress' | 'completed';
      siteAddressJson?: any;
    }) => this.makeRequest('jobs.create', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
    update: (input: {
      id: string;
      status?: 'planning' | 'in_progress' | 'completed';
      siteAddressJson?: any;
    }) => this.makeRequest('jobs.update', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  };

  // Estimates endpoints
  estimates = {
    list: (input: { divisionKey?: 'mfnc' | 'sfnc' | 'rr'; status?: 'draft' | 'sent' | 'approved' | 'rejected'; page?: number } = {}) => {
      const params = new URLSearchParams();
      if (input.divisionKey) params.set('divisionKey', input.divisionKey);
      if (input.status) params.set('status', input.status);
      if (input.page) params.set('page', input.page.toString());
      return this.makeRequest(`estimates.list?${params}`);
    },
    create: (input: {
      jobId: string;
      status?: 'draft' | 'sent' | 'approved' | 'rejected';
      totalCents: number;
      linesJson: any;
    }) => this.makeRequest('estimates.create', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
    update: (input: {
      id: string;
      status?: 'draft' | 'sent' | 'approved' | 'rejected';
      totalCents?: number;
      linesJson?: any;
    }) => this.makeRequest('estimates.update', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),
  };

  // Divisions endpoints
  divisions = {
    getAll: () => this.makeRequest('divisions.getAll'),
    getByKey: (input: { key: 'mfnc' | 'sfnc' | 'rr' }) => {
      const params = new URLSearchParams(input);
      return this.makeRequest(`divisions.getByKey?${params}`);
    },
  };
}

export const trpcClient = new TRPCClient();

// React Query integration helpers
export const createTRPCQueryKey = (endpoint: string, input?: any) => {
  return input ? [endpoint, input] : [endpoint];
};

// Custom hooks for React Query integration
export const useTRPCQuery = (endpoint: string, input?: any, options?: any) => {
  // This would be implemented with useQuery
  // For now, returning a placeholder
  return { data: null, isLoading: false, error: null };
};