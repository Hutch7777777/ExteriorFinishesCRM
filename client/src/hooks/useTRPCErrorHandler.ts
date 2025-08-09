import { TRPCClientError } from '@trpc/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRouter } from '../../../server/routers/appRouter';

export function useTRPCErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: unknown, defaultMessage = 'An error occurred') => {
    if (error instanceof TRPCClientError) {
      // Handle specific tRPC errors
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
          toast({
            title: 'Authentication Required',
            description: 'Please sign in to continue.',
            variant: 'destructive',
          });
          // Redirect to sign-in page
          window.location.href = '/';
          break;
        
        case 'FORBIDDEN':
          toast({
            title: 'Access Denied',
            description: error.message || 'You do not have permission to perform this action.',
            variant: 'destructive',
          });
          break;
        
        case 'BAD_REQUEST':
          toast({
            title: 'Invalid Request',
            description: error.message || 'Please check your input and try again.',
            variant: 'destructive',
          });
          break;
        
        case 'NOT_FOUND':
          toast({
            title: 'Not Found',
            description: error.message || 'The requested resource was not found.',
            variant: 'destructive',
          });
          break;
        
        case 'INTERNAL_SERVER_ERROR':
          toast({
            title: 'Server Error',
            description: 'Something went wrong on our end. Please try again later.',
            variant: 'destructive',
          });
          break;
        
        default:
          toast({
            title: 'Error',
            description: error.message || defaultMessage,
            variant: 'destructive',
          });
      }
    } else {
      // Handle non-tRPC errors
      toast({
        title: 'Error',
        description: defaultMessage,
        variant: 'destructive',
      });
    }
  };

  return { handleError };
}