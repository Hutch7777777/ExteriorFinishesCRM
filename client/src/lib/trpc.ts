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
    list: (input: { divisionKey?: string } = {}) => {
      const params = new URLSearchParams(input as any);
      return this.makeRequest(`customers.list?${params}`);
    },
    get: (input: { id: string }) => {
      const params = new URLSearchParams(input);
      return this.makeRequest(`customers.get?${params}`);
    },
    create: (input: any) => this.makeRequest('customers.create', {
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