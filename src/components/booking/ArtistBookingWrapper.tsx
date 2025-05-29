"use client";

import { useState, useEffect } from "react";
import ArtistBooking from "./ArtistBooking";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration?: number;
  isActive: boolean;
  artistId: string;
}

interface AvailabilitySettings {
  isAvailable: boolean;
  workingHours: {
    start: number;
    end: number;
    interval: number;
  };
  regularDaysOff: number[];
  bookedSlots?: {
    date: string;
    time: string;
    booking_id: string;
    service_type: string;
    status: string;
  }[];
}

interface ArtistBookingWrapperProps {
  artistId: string;
  services: Service[];
  isUserLoggedIn: boolean;
  availabilitySettings: AvailabilitySettings;
}

export default function ArtistBookingWrapper({
  artistId,
  services,
  isUserLoggedIn,
  availabilitySettings,
}: ArtistBookingWrapperProps) {
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedServices, setHasLoadedServices] = useState(false);

  // Log availability settings for debugging
  useEffect(() => {
    console.log(
      "ArtistBookingWrapper received availabilitySettings:",
      availabilitySettings
    );
    console.log("Regular days off:", availabilitySettings.regularDaysOff);
  }, [availabilitySettings]);

  // Only fetch artist data if user is logged in
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!isUserLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/artists/${artistId}/info`);
        if (response.ok) {
          const data = await response.json();
          setArtistData(data);
        }
      } catch (error) {
        console.error("Error fetching artist data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId, isUserLoggedIn]);

  // Create default service using artist's default price
  const defaultService: Service = {
    id: "default-service", // Using a special ID to identify default service
    name: artistData?.name
      ? `Standard Session with ${artistData.name}`
      : "Standard Session",
    description: "Book a standard appointment with the artist",
    price: artistData?.defaultPrice || 0, // Use artist's default price if available
    duration: 60, // Duration can be adjusted as needed
    isActive: true,
    artistId: artistId,
  };

  // Use null for initial state instead of defaultService
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Update default service when artist data is loaded, but only if no real services exist
  useEffect(() => {
    if (
      isUserLoggedIn &&
      artistData?.defaultPrice &&
      services.length === 0 &&
      !hasLoadedServices
    ) {
      // Only set a default service if we have NO real services
      setSelectedService({
        ...defaultService,
        name: `Standard Session with ${artistData.name || "Artist"}`,
        description: `Book a standard appointment with ${
          artistData.name || "the artist"
        }`,
        price: artistData.defaultPrice,
        isActive: true,
        artistId: artistId,
      });

      setHasLoadedServices(true);
    } else if (services.length > 0 && !hasLoadedServices) {
      // If we have real services, we don't need a default one
      setHasLoadedServices(true);
      // We'll let ArtistBooking handle service selection
      setSelectedService(null);
    }
  }, [
    artistData,
    artistId,
    services,
    hasLoadedServices,
    defaultService,
    isUserLoggedIn,
  ]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Don't render booking component for non-logged-in users
  if (!isUserLoggedIn) {
    return null;
  }

  // Only use the default service if there are no real services
  const availableServices =
    services.length > 0 ? services : selectedService ? [selectedService] : [];

  return (
    <ArtistBooking
      artistId={artistId}
      services={availableServices}
      selectedService={selectedService}
      isUserLoggedIn={isUserLoggedIn}
      availabilitySettings={availabilitySettings}
      artistData={artistData} // Pass the artist data to show more details in booking
    />
  );
}
