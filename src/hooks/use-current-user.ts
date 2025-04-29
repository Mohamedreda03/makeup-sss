import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();

  // Fetch fresh user data from database
  const {
    data: currentUser,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/user/current");
        return response.data;
      } catch (error) {
        console.error("Error fetching current user data:", error);
        throw error;
      }
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Refresh user data - can be called after image update
  const refreshUserData = async () => {
    try {
      await refetch();
      return true;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return false;
    }
  };

  return {
    currentUser,
    isLoading,
    error,
    sessionStatus,
    session,
    updateSession,
    refreshUserData,
  };
}
