import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  divisionId: string | null;
}

interface AuthResponse {
  user: AuthUser;
}

export function useAuth() {
  const { data: userData, isLoading, error } = useQuery<AuthResponse | null>({
    queryKey: ["auth.me"],
    queryFn: async () => {
      try {
        return await trpcClient.auth.me();
      } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          return null; // User not authenticated
        }
        throw error; // Other errors should be thrown
      }
    },
    retry: false,
  });

  return {
    user: userData?.user,
    isLoading,
    isAuthenticated: !!userData?.user && !error,
  };
}
