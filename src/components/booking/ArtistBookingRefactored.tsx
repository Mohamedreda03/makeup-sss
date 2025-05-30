"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import ServiceSelector from "./ServiceSelector";
import { BookingStep } from "./BookingSteps";
import { DateSelector } from "./DateSelector";
import { TimeSelector } from "./TimeSelector";
import { NotesField } from "./NotesField";
import { BookingSummary } from "./BookingSummary";
import { BookingActions } from "./BookingActions";
import { AuthRequired } from "./AuthRequired";
import { NotAvailable } from "./NotAvailable";

interface TimeSlot {
  time: string;
  label: string;
  isBooked?: boolean;
}

interface DayAvailability {
  date: string;
  dayLabel: string;
  dayNumber: string;
  monthName: string;
  isDayOff?: boolean;
  timeSlots: TimeSlot[];
}

interface ArtistAvailability {
  artistId: string;
  artistName: string;
  isAvailable: boolean;
  message?: string;
  availability: DayAvailability[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  artistId: string;
  duration?: number;
}

interface ArtistBookingProps {
  artistId: string;
  services: Service[];
  selectedService: Service | null;
  isUserLoggedIn: boolean;
  artistData?: {
    name?: string;
    [key: string]: unknown;
  };
  availabilitySettings: {
    isAvailable: boolean;
    workingHours: {
      start: number;
      end: number;
      interval: number;
    };
    regularDaysOff: number[];
  };
}

export default function ArtistBooking({
  artistId,
  services,
  selectedService: initialSelectedService,
  isUserLoggedIn,
  availabilitySettings,
  artistData,
}: ArtistBookingProps) {
  const router = useRouter();

  // State management
  const [availability, setAvailability] = useState<ArtistAvailability | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Service state
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialSelectedService
  );
  const [availableServices, setAvailableServices] =
    useState<Service[]>(services);

  // Fetch artist services from API
  useEffect(() => {
    const fetchServices = async () => {
      if (!artistId) return;

      try {
        setIsLoadingServices(true);
        const response = await fetch(`/api/artists/${artistId}/services`);

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setAvailableServices(data);

            if ((!selectedService || !selectedService.id) && data[0]?.id) {
              setSelectedService(data[0]);
              toast({
                title: "Service Selected Automatically",
                description:
                  "We've selected the first service for you. You can choose a different one if you prefer.",
                variant: "default",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching artist services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    if (!availableServices.length) {
      fetchServices();
    }
  }, [artistId, availableServices.length, selectedService]);

  // Fetch availability data from the API
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!artistId) return;

      try {
        setIsLoading(true);
        // Include serviceId in the URL if a service is selected
        let url = `/api/artists/${artistId}/availability?days=14`;
        if (selectedService?.id) {
          url += `&serviceId=${selectedService.id}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch availability: ${response.status}`);
        }

        const data = await response.json();

        if (!data.isAvailable && availabilitySettings) {
          data.isAvailable = availabilitySettings.isAvailable;
        }

        setAvailability(data);

        // Pre-select the first available day
        if (data.isAvailable && data.availability?.length > 0) {
          const availableDays = data.availability.filter(
            (day: DayAvailability) => !day.isDayOff && day.timeSlots?.length > 0
          );

          data.availability = availableDays;

          if (availableDays.length > 0 && !selectedDate) {
            setSelectedDate(availableDays[0].date);
          }
        }
      } catch (error) {
        console.error("Error fetching artist availability:", error);
        toast({
          title: "Error",
          description: "Could not load artist availability. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (artistId) {
      fetchAvailability();
    }
  }, [artistId, availabilitySettings, selectedService?.id, selectedDate]);

  // Early return for non-authenticated users
  if (!isUserLoggedIn) {
    return <AuthRequired isUserLoggedIn={isUserLoggedIn} />;
  }

  // Generate time slots based on artist's actual settings from database
  const generateTimeSlots = (date: string) => {
    if (!date) return [];

    if (availability?.availability) {
      const dayAvailability = availability.availability.find(
        (day) => day.date === date
      );
      return dayAvailability?.timeSlots || [];
    }

    return [];
  };
  // Get time slots for the selected date
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  // Event handlers
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    // Clear selected date and time when service changes to force re-selection with new intervals
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Book appointment handler
  const handleBookAppointment = async () => {
    if (!selectedService?.id || !selectedDate || !selectedTime) {
      toast({
        title: "Cannot Book Yet",
        description:
          "You must select a service, date, and time before booking.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedService.price || selectedService.price <= 0) {
      toast({
        title: "Invalid Price",
        description:
          "The selected service has an invalid price. Please select a different service.",
        variant: "destructive",
      });
      return;
    }

    if (!isUserLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    setIsBooking(true);
    try {
      // Parse time and create datetime in the target timezone (Africa/Cairo)
      const [timeStr, period] = selectedTime.split(" ");
      const [hoursStr, minutesStr] = timeStr.split(":");
      let hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);

      if (period === "PM" && hours !== 12) hours += 12;
      else if (period === "AM" && hours === 12) hours = 0;

      const [year, month, day] = selectedDate.split("-");

      // Create date object in local time (this will be interpreted as Africa/Cairo on the server)
      const datetime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes
      );

      // Send the datetime in ISO format but without converting to UTC
      // Format: YYYY-MM-DDTHH:mm:ss (without Z suffix to indicate local time)
      const localDatetimeString =
        datetime.getFullYear() +
        "-" +
        String(datetime.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(datetime.getDate()).padStart(2, "0") +
        "T" +
        String(datetime.getHours()).padStart(2, "0") +
        ":" +
        String(datetime.getMinutes()).padStart(2, "0") +
        ":" +
        String(datetime.getSeconds()).padStart(2, "0");

      console.log("Sending appointment data:", {
        selectedDate,
        selectedTime,
        localDateTime: datetime.toLocaleString(),
        sentDatetime: localDatetimeString,
      });

      const appointmentData = {
        artistId,
        serviceId: selectedService.id,
        serviceType: selectedService.name,
        datetime: localDatetimeString, // Send local time without timezone conversion
        duration: selectedService.duration || 60,
        totalPrice: selectedService.price,
        notes: notes || "",
      };

      const response = await fetch("/api/appointment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create appointment request");
      }

      localStorage.setItem(
        `appointment-request-${data.appointmentRequest.tempId}`,
        JSON.stringify(data.appointmentRequest)
      );

      toast({
        title: "Proceed to Payment",
        description: "Please complete payment to confirm your booking.",
      });

      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error creating appointment request:", error);
      toast({
        title: "Booking Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating your appointment request",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Helper function
  const isDayOff = (date: string) => {
    if (!date || !availabilitySettings) return false;
    const dayOfWeek = new Date(date).getDay();
    return availabilitySettings.regularDaysOff.includes(dayOfWeek);
  };

  // Loading state
  if (isLoading || isLoadingServices) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // Not available state
  if (availability?.isAvailable === false) {
    return <NotAvailable message={availability.message} />;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-center mb-8">
        Book an Appointment
      </h2>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="p-6">
          {/* Service Selection Step */}
          <BookingStep step={1} title="Select a Service" isActive={true}>
            <ServiceSelector
              services={availableServices}
              onServiceSelect={handleServiceSelect}
              selectedServiceId={selectedService?.id || null}
            />
          </BookingStep>

          {/* Date Selection - Only show if service is selected */}
          {selectedService && (
            <BookingStep
              step={2}
              title="Select a Date"
              isActive={!!selectedService}
            >
              <DateSelector
                availability={availability?.availability || []}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                isDayOff={isDayOff}
              />
            </BookingStep>
          )}

          {/* Time Selection - Only show if date is selected */}
          {selectedService && selectedDate && (
            <BookingStep
              step={3}
              title="Select a Time"
              isActive={!!selectedDate}
            >
              <TimeSelector
                timeSlots={timeSlots}
                selectedTime={selectedTime}
                onTimeSelect={handleTimeSelect}
              />
            </BookingStep>
          )}

          <div className="max-w-2xl mx-auto mt-8">
            {/* Notes Field */}
            {selectedService && selectedDate && selectedTime && (
              <NotesField notes={notes} onNotesChange={setNotes} />
            )}

            {/* Booking Summary */}
            {selectedService && selectedDate && selectedTime && (
              <BookingSummary
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                artistName={artistData?.name}
              />
            )}
          </div>
        </div>
      </div>

      {/* Booking Actions */}
      <BookingActions
        isUserLoggedIn={isUserLoggedIn}
        selectedService={selectedService}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        isBooking={isBooking}
        onBookAppointment={handleBookAppointment}
      />

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg">
              Login Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Please sign in to complete your booking
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center gap-2">
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={() => router.push("/sign-in")}
                className="text-xs"
              >
                Sign In
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
