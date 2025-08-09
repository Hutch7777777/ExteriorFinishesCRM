import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

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
  const { data: userData, isLoading } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    user: userData?.user,
    isLoading,
    isAuthenticated: !!userData?.user,
  };
}
