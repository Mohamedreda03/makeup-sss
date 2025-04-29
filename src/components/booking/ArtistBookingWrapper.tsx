"use client";

import { useState, useEffect } from "react";
import ArtistBooking from "./ArtistBooking";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface AvailabilitySettings {
  isAvailable: boolean;
  workingHours: {
    start: number;
    end: number;
    interval: number;
  };
  regularDaysOff: number[];
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

  // Log availability settings for debugging
  useEffect(() => {
    console.log(
      "ArtistBookingWrapper received availabilitySettings:",
      availabilitySettings
    );
    console.log("Regular days off:", availabilitySettings.regularDaysOff);
  }, [availabilitySettings]);

  // Fetch artist data to get default price
  useEffect(() => {
    const fetchArtistData = async () => {
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
  }, [artistId]);

  // Create default service using artist's default price
  const defaultService: Service = {
    id: "default-service",
    name: artistData?.name
      ? `Standard Session with ${artistData.name}`
      : "Standard Session",
    description: "Book a standard appointment with the artist",
    price: artistData?.defaultPrice || 0, // Use artist's default price if available
    duration: 60, // Duration can be adjusted as needed
  };

  // Use default service instead of null
  const [selectedService, setSelectedService] =
    useState<Service>(defaultService);

  // Update default service when artist data is loaded
  useEffect(() => {
    if (artistData?.defaultPrice) {
      setSelectedService({
        ...defaultService,
        name: `Standard Session with ${artistData.name || "Artist"}`,
        description: `Book a standard appointment with ${
          artistData.name || "the artist"
        }`,
        price: artistData.defaultPrice,
      });
    }
  }, [artistData]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  // Display default service only if there are no other services
  const availableServices = services.length > 0 ? services : [selectedService];

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
