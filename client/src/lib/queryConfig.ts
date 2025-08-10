// Default query configuration for better performance
export const defaultQueryConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh
  cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  retry: 1, // Only retry once on failure
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
  refetchOnReconnect: true, // Refetch when connection is restored
}

// Specific configs for different data types
export const queryConfigs = {
  // Static/slow-changing data - cache longer
  divisions: {
    ...defaultQueryConfig,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
  
  // User data - cache moderately
  users: {
    ...defaultQueryConfig,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Business data - cache briefly
  customers: defaultQueryConfig,
  jobs: defaultQueryConfig,
  estimates: defaultQueryConfig,
  
  // Real-time data - minimal caching
  communication: {
    ...defaultQueryConfig,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
  },
}