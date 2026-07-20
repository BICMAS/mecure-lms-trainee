import { useQuery } from "@tanstack/react-query";
import { fetchLearnerDashboard } from "@/api/dashboard";
import { useAuth } from "@/context/AuthContext";

export const useDashboard = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["dashboard", token],
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    queryFn: fetchLearnerDashboard,
  });
};
