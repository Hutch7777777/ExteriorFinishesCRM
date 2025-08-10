import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { queryConfigs } from '@/lib/queryConfig'

type DataType = 'divisions' | 'users' | 'customers' | 'jobs' | 'estimates' | 'communication'

/**
 * Custom hook that provides optimized query configuration based on data type
 */
export function useOptimizedQuery<TData, TError = Error>(
  dataType: DataType,
  options: UseQueryOptions<TData, TError>
) {
  const config = queryConfigs[dataType]
  
  return useQuery<TData, TError>({
    ...config,
    ...options,
    // Merge any custom options while keeping our performance optimizations
  })
}

/**
 * Prefetch data for faster navigation
 */
export function usePrefetchData() {
  // This can be used to prefetch common data when the app loads
  // or when hovering over navigation items
}