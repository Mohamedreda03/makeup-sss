"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Check, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  artistId: string;
  duration?: number;
}

interface ServiceSelectorProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  selectedServiceId: string | null;
}

export default function ServiceSelector({
  services,
  onServiceSelect,
  selectedServiceId,
}: ServiceSelectorProps) {
  const [autoSelected, setAutoSelected] = useState(false);

  // Check if service was auto-selected on first render
  useEffect(() => {
    // Only set autoSelected if there's a valid selectedServiceId
    if (
      selectedServiceId &&
      selectedServiceId !== "default-service" &&
      services.length > 0 &&
      !autoSelected
    ) {
      // Verify that the service with this ID exists in our services array
      const serviceExists = services.some(
        (service) => service.id === selectedServiceId
      );
      if (serviceExists) {
        setAutoSelected(true);
      }
    }
  }, [selectedServiceId, services, autoSelected]);

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No services available for this artist.
      </div>
    );
  }

  // Determine if a service is actually selected with a valid ID
  const hasValidSelection =
    selectedServiceId &&
    selectedServiceId !== "default-service" &&
    services.some((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold mb-1">Select a Service</h3>
        <p className="text-gray-500 text-xs">
          Choose a service before selecting your appointment date and time
        </p>
      </div>

      {autoSelected && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-2 mb-3 flex items-start">
          <Info className="h-3 w-3 text-blue-500 mr-1.5 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            We've selected the first service for you
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                isSelected
                  ? "border-2 border-rose-500"
                  : "border border-gray-200 hover:border-rose-300"
              }`}
              onClick={() => {
                onServiceSelect(service);
                setAutoSelected(false); // Clear auto-selected flag when user manually selects
              }}
            >
              <div
                className={`${
                  isSelected ? "bg-rose-50" : "bg-white"
                } p-4 relative`}
              >
                <div className="mb-3">
                  <h4 className="font-bold text-lg text-gray-800">
                    {service.name}
                  </h4>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {service.description || "No description available"}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center bg-green-50 text-green-700 border-green-200 text-xs py-0.5"
                    >
                      EGP
                      {service.price.toFixed(2)}
                    </Badge>
                  </div>

                  {isSelected && (
                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-rose-500" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
