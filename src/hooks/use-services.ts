import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration?: number;
  isActive: boolean;
  artistId: string;
}

interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  isActive: boolean;
  artistId: string;
}

/**
 * Hook for managing services with React Query
 */
export function useServices(userId: string) {
  const queryClient = useQueryClient();

  // Fetch services
  const {
    data: services = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["services", userId],
    queryFn: async () => {
      const response = await fetch(`/api/services?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Create a new service
  const createService = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create service");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the services query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["services", userId] });

      toast({
        title: "Success",
        description: "Service created successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  // Update a service
  const updateService = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      const response = await fetch("/api/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update service");
      }

      return response.json();
    },
    onSuccess: (updatedService) => {
      // Update the service in the cache
      queryClient.setQueryData(
        ["services", userId],
        (oldData: Service[] = []) => {
          return oldData.map((service) =>
            service.id === updatedService.id ? updatedService : service
          );
        }
      );

      toast({
        title: "Success",
        description: "Service updated successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  // Delete a service
  const deleteService = useMutation({
    mutationFn: async ({
      serviceId,
      artistId,
    }: {
      serviceId: string;
      artistId: string;
    }) => {
      const response = await fetch(
        `/api/services?id=${serviceId}&artistId=${artistId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete service");
      }

      return { id: serviceId };
    },
    onSuccess: ({ id }) => {
      // Remove the service from the cache
      queryClient.setQueryData(
        ["services", userId],
        (oldData: Service[] = []) => {
          return oldData.filter((service) => service.id !== id);
        }
      );

      toast({
        title: "Success",
        description: "Service deleted successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    },
  });

  return {
    services,
    isLoading,
    error,
    refetch,
    createService,
    updateService,
    deleteService,
  };
}
