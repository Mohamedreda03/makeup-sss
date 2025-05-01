"use client";

import { useState, useEffect, useRef, MouseEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parse, isToday, isAfter, isBefore, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";
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
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ServiceSelector from "./ServiceSelector";

interface TimeSlot {
  time: string;
  label: string;
  isBooked: boolean;
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
  artistData?: any;
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
  const { data: session } = useSession();
  const router = useRouter();

  // Ensure only logged-in users can access this component
  if (!isUserLoggedIn) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-6 w-6 text-amber-700" />
          <h3 className="text-xl font-semibold text-amber-800">
            Authentication Required
          </h3>
          <p className="text-amber-700 max-w-md mx-auto">
            You need to sign in to book appointments with this artist.
          </p>
          <div className="flex gap-4 mt-2">
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <Link href="/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sliderRef = useRef<HTMLDivElement>(null);
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const timeSlotContainerRef = useRef<HTMLDivElement>(null);

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
  const [canScroll, setCanScroll] = useState(false);

  // Add state for selected service
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialSelectedService
  );
  const [availableServices, setAvailableServices] =
    useState<Service[]>(services);

  // Variables to track dragging state for time slots
  const [isTimeDragging, setIsTimeDragging] = useState(false);
  const [timeStartX, setTimeStartX] = useState(0);
  const [timeScrollLeft, setTimeScrollLeft] = useState(0);

  // Variables to track dragging state for days
  const [isDayDragging, setIsDayDragging] = useState(false);
  const [dayStartX, setDayStartX] = useState(0);
  const [dayScrollLeft, setDayScrollLeft] = useState(0);

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

            // تعديل الاختيار التلقائي ليتم فقط إذا لم يكن هناك خدمة مختارة بالفعل
            // وأن تكون الخدمة الأولى لها معرف صالح
            if (
              (!selectedService || !selectedService.id) &&
              data[0] &&
              data[0].id
            ) {
              console.log("Auto-selecting first service:", data[0]);
              setSelectedService(data[0]);

              // Show a toast message to inform the user
              toast({
                title: "Service Selected Automatically",
                description:
                  "We've selected the first service for you. You can choose a different one if you prefer.",
                variant: "default",
              });

              // Scroll to date selection after a brief delay
              setTimeout(() => {
                const dateSection = document.getElementById(
                  "date-selection-section"
                );
                if (dateSection) {
                  dateSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching artist services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [artistId, selectedService]);

  // Generate time slots based on artist's actual settings from database
  const generateTimeSlots = (date: string) => {
    if (!date) return [];

    // Use the selected day's availability data directly from API
    if (availability && availability.availability) {
      const dayAvailability = availability.availability.find(
        (day) => day.date === date
      );

      if (dayAvailability) {
        // Return the time slots directly from the API response
        // These already account for artist's working hours, interval settings, and booked slots
        return dayAvailability.timeSlots;
      }
    }

    // Fallback to empty array if the date isn't found in the availability data
    return [];
  };

  // Find the selected day's availability
  const selectedDayAvailability = selectedDate
    ? availability?.availability.find((day) => day.date === selectedDate)
    : null;

  // Get time slots for the selected date
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (timeSlotContainerRef.current) {
        const container = timeSlotContainerRef.current;
        setCanScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);

    return () => {
      window.removeEventListener("resize", checkScrollable);
    };
  }, [timeSlots]);

  // Mouse events handlers for time slots
  const handleTimeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!timeSlotContainerRef.current) return;
    setIsTimeDragging(true);
    setTimeStartX(e.clientX);
    setTimeScrollLeft(timeSlotContainerRef.current.scrollLeft);
    timeSlotContainerRef.current.style.cursor = "grabbing";
    timeSlotContainerRef.current.style.userSelect = "none";
  };

  const handleTimeMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isTimeDragging || !timeSlotContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (timeStartX - x) * 2;
    timeSlotContainerRef.current.scrollLeft = timeScrollLeft + walk;
  };

  const handleTimeMouseUp = () => {
    setIsTimeDragging(false);
    if (timeSlotContainerRef.current) {
      timeSlotContainerRef.current.style.cursor = "grab";
      timeSlotContainerRef.current.style.removeProperty("user-select");
    }
  };

  // Touch events handlers for time slots
  const handleTimeTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!timeSlotContainerRef.current || !e.touches[0]) return;
    setIsTimeDragging(true);
    setTimeStartX(e.touches[0].clientX);
    setTimeScrollLeft(timeSlotContainerRef.current.scrollLeft);
  };

  const handleTimeTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isTimeDragging || !timeSlotContainerRef.current || !e.touches[0])
      return;
    const x = e.touches[0].clientX;
    const walk = (timeStartX - x) * 2;
    timeSlotContainerRef.current.scrollLeft = timeScrollLeft + walk;
  };

  const handleTimeTouchEnd = () => {
    setIsTimeDragging(false);
  };

  // Mouse events handlers for days container
  const handleDayMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!daysContainerRef.current) return;
    setIsDayDragging(true);
    setDayStartX(e.clientX);
    setDayScrollLeft(daysContainerRef.current.scrollLeft);
    daysContainerRef.current.style.cursor = "grabbing";
    daysContainerRef.current.style.userSelect = "none";
  };

  const handleDayMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDayDragging || !daysContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX;
    const walk = (dayStartX - x) * 2;
    daysContainerRef.current.scrollLeft = dayScrollLeft + walk;
  };

  const handleDayMouseUp = () => {
    setIsDayDragging(false);
    if (daysContainerRef.current) {
      daysContainerRef.current.style.cursor = "grab";
      daysContainerRef.current.style.removeProperty("user-select");
    }
  };

  // Touch events handlers for days container
  const handleDayTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!daysContainerRef.current || !e.touches[0]) return;
    setIsDayDragging(true);
    setDayStartX(e.touches[0].clientX);
    setDayScrollLeft(daysContainerRef.current.scrollLeft);
  };

  const handleDayTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDayDragging || !daysContainerRef.current || !e.touches[0]) return;
    const x = e.touches[0].clientX;
    const walk = (dayStartX - x) * 2;
    daysContainerRef.current.scrollLeft = dayScrollLeft + walk;
  };

  const handleDayTouchEnd = () => {
    setIsDayDragging(false);
  };

  // Effect for global event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsTimeDragging(false);
      setIsDayDragging(false);

      if (timeSlotContainerRef.current) {
        timeSlotContainerRef.current.style.cursor = "grab";
        timeSlotContainerRef.current.style.removeProperty("user-select");
      }

      if (daysContainerRef.current) {
        daysContainerRef.current.style.cursor = "grab";
        daysContainerRef.current.style.removeProperty("user-select");
      }
    };

    const handleGlobalTouchEnd = () => {
      setIsTimeDragging(false);
      setIsDayDragging(false);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, []);

  // Fetch artist availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        // Pass the date range params
        const response = await fetch(
          `/api/artists/${artistId}/availability?days=14`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();

        // Log availability data for debugging
        console.log("Artist availability data:", data);
        console.log(
          "Regular days off from props:",
          availabilitySettings.regularDaysOff
        );

        // Use the availability settings to customize display
        if (!data.isAvailable && availabilitySettings) {
          data.isAvailable = availabilitySettings.isAvailable;
        }

        setAvailability(data);

        // Pre-select the first available day that isn't a day off and has time slots
        if (
          data.isAvailable &&
          data.availability &&
          data.availability.length > 0
        ) {
          // Filter out days off and days without time slots
          const availableDays = data.availability.filter(
            (day: DayAvailability) => {
              // Include only days that are not days off and have time slots
              return !day.isDayOff && day.timeSlots && day.timeSlots.length > 0;
            }
          );

          // Update the availability to only include available days
          data.availability = availableDays;

          if (availableDays.length > 0) {
            setSelectedDate(availableDays[0].date);
            console.log(
              "Auto-selected first available day:",
              availableDays[0].date
            );
          } else {
            console.log("No available days found with time slots.");
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
  }, [artistId, availabilitySettings]);

  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    // Reset date and time when changing service
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Book appointment handler with strict validation
  const handleBookAppointment = async () => {
    // STRICT VALIDATION: Prevent booking if any selection is missing
    if (
      !selectedService ||
      !selectedService.id ||
      !selectedDate ||
      !selectedTime
    ) {
      toast({
        title: "Cannot Book Yet",
        description:
          "You must select a service, date, and time before booking.",
        variant: "destructive",
      });
      return;
    }

    // ADDITIONAL PRICE VALIDATION: Ensure service has a valid price
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
      // Parse time into hours and minutes
      const [timeStr, period] = selectedTime.split(" ");
      const [hoursStr, minutesStr] = timeStr.split(":");

      let hours = parseInt(hoursStr);
      const minutes = parseInt(minutesStr);

      // Convert to 24-hour format
      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      // Create the datetime
      const [year, month, day] = selectedDate.split("-");
      const datetime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hours,
        minutes
      );

      // Create appointment data with the selected service
      const appointmentData = {
        artistId,
        serviceId: selectedService.id,
        serviceType: selectedService.name,
        datetime: datetime.toISOString(),
        duration: selectedService.duration || 60, // Default to 60 minutes if not specified
        totalPrice: selectedService.price,
        notes: notes || "",
      };

      console.log("Sending appointment request data:", appointmentData);

      // Instead of creating appointment directly, we'll send a request to validate it
      // and then redirect to payment page
      const response = await fetch("/api/appointment-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Failed to create appointment request");
      }

      console.log("Appointment request created successfully:", data);

      // Store the request data in localStorage for the payment page to use
      localStorage.setItem(
        `appointment-request-${data.appointmentRequest.tempId}`,
        JSON.stringify(data.appointmentRequest)
      );

      // Success notification
      toast({
        title: "Proceed to Payment",
        description: "Please complete payment to confirm your booking.",
        variant: "success",
      });

      // Redirect to payment page
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

  // Helper function to check if a day is a regular day off
  const isDayOff = (date: string) => {
    if (!date || !availabilitySettings) return false;

    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday
    return availabilitySettings.regularDaysOff.includes(dayOfWeek);
  };

  if (isLoading || isLoadingServices) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // If artist is not available for booking
  if (availability && availability.isAvailable === false) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto text-center bg-amber-50 p-6 rounded-lg border border-amber-200">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">
            Not Accepting Bookings
          </h2>
          <p className="text-amber-700 mb-4">
            {availability.message ||
              "This artist is not currently accepting bookings."}
          </p>
          <p className="text-sm text-amber-600">
            Please check back later or contact the artist for more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-center mb-8">
        Book an Appointment
      </h2>

      {/* Main booking process container */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
        {/* Booking progress indicator */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  selectedService && selectedService.id
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <span className="font-bold">1</span>
              </div>
              <span className="text-xs font-medium">Service</span>
            </div>

            <div
              className={`flex-1 h-1 mx-2 ${
                selectedService && selectedService.id
                  ? "bg-rose-300"
                  : "bg-gray-200"
              }`}
            ></div>

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  selectedDate
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <span className="font-bold">2</span>
              </div>
              <span className="text-xs font-medium">Date</span>
            </div>

            <div
              className={`flex-1 h-1 mx-2 ${
                selectedDate ? "bg-rose-300" : "bg-gray-200"
              }`}
            ></div>

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  selectedTime
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <span className="font-bold">3</span>
              </div>
              <span className="text-xs font-medium">Time</span>
            </div>

            <div
              className={`flex-1 h-1 mx-2 ${
                selectedTime ? "bg-rose-300" : "bg-gray-200"
              }`}
            ></div>

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                  selectedService &&
                  selectedService.id &&
                  selectedDate &&
                  selectedTime
                    ? "bg-rose-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <span className="font-bold">4</span>
              </div>
              <span className="text-xs font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Booking content */}
        <div className="p-6">
          {/* Service Selection Step */}
          <div className="my-6">
            <div className="flex items-center mb-4">
              <div className="bg-rose-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                1
              </div>
              <h3 className="text-lg font-semibold">Select a Service</h3>
            </div>
            <ServiceSelector
              services={availableServices}
              onServiceSelect={handleServiceSelect}
              selectedServiceId={selectedService?.id || null}
            />
          </div>

          {/* Only show date/time selection if a service is selected */}
          {selectedService && (
            <>
              {/* Date Selection */}
              <div className="mt-8 mb-4" id="date-selection-section">
                <div className="flex items-center mb-4">
                  <div className="bg-rose-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">Select a Date</h3>
                </div>
                {availability?.availability &&
                availability.availability.length > 0 ? (
                  <div className="overflow-hidden pb-6">
                    <div
                      ref={daysContainerRef}
                      className="overflow-x-auto py-2 scrollbar-hide cursor-grab"
                      style={{
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      onMouseDown={handleDayMouseDown}
                      onMouseMove={handleDayMouseMove}
                      onMouseUp={handleDayMouseUp}
                      onMouseLeave={handleDayMouseUp}
                      onTouchStart={handleDayTouchStart}
                      onTouchMove={handleDayTouchMove}
                      onTouchEnd={handleDayTouchEnd}
                    >
                      <div className="flex space-x-4 min-w-max pl-4 pr-4">
                        {availability.availability
                          .filter(
                            (day) =>
                              !isDayOff(day.date) && day.timeSlots.length > 0
                          )
                          .map((day) => {
                            // Check if this day has any non-booked slots
                            const hasAvailableSlots = day.timeSlots.some(
                              (slot) => !slot.isBooked
                            );
                            if (!hasAvailableSlots) return null;

                            return (
                              <button
                                key={day.date}
                                onClick={() => handleDateSelect(day.date)}
                                className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-colors ${
                                  selectedDate === day.date
                                    ? "bg-rose-400 text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                <span className="text-xs font-medium uppercase">
                                  {day.dayLabel}
                                </span>
                                <span className="text-2xl font-bold">
                                  {day.dayNumber}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No availability found for this artist
                  </div>
                )}
              </div>

              {/* Time Slots - Only show if date is selected */}
              {selectedDate && (
                <div className="mt-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-rose-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Select a Time</h3>
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="w-full overflow-hidden relative">
                      <div
                        ref={timeSlotContainerRef}
                        className="overflow-x-auto py-6 scrollbar-hide cursor-grab"
                        style={{
                          scrollbarWidth: "none",
                          msOverflowStyle: "none",
                          WebkitOverflowScrolling: "touch",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                        }}
                        onMouseDown={handleTimeMouseDown}
                        onMouseMove={handleTimeMouseMove}
                        onMouseUp={handleTimeMouseUp}
                        onMouseLeave={handleTimeMouseUp}
                        onTouchStart={handleTimeTouchStart}
                        onTouchMove={handleTimeTouchMove}
                        onTouchEnd={handleTimeTouchEnd}
                      >
                        <div className="flex space-x-4 min-w-max">
                          {timeSlots
                            .filter((slot) => !slot.isBooked)
                            .map((slot) => (
                              <button
                                key={slot.time}
                                onClick={() => handleTimeSelect(slot.time)}
                                className={`py-3 px-4 rounded-full border transition-colors ${
                                  selectedTime === slot.time
                                    ? "bg-rose-500 text-white border-rose-500"
                                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                                style={{
                                  minWidth: "110px",
                                  boxShadow:
                                    selectedTime === slot.time
                                      ? "none"
                                      : "0 1px 2px rgba(0,0,0,0.05)",
                                }}
                              >
                                <div className="text-center font-medium">
                                  {slot.label}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Custom scrollbar styling */}
                      <style jsx global>{`
                        .scrollbar-hide::-webkit-scrollbar {
                          display: none;
                        }
                        .scrollbar-hide {
                          -ms-overflow-style: none;
                          scrollbar-width: none;
                        }
                      `}</style>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                      No available time slots for this day
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="max-w-2xl mx-auto mt-8">
            {/* Notes Field - Only show if date and time are selected */}
            {selectedService && selectedDate && selectedTime && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium mb-2"
                >
                  Special Requests or Notes
                </label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or additional information"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-white"
                />
              </div>
            )}

            {/* Booking Summary - Shows all selected details */}
            {selectedService && selectedDate && selectedTime && (
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-rose-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3">
                    4
                  </div>
                  <h3 className="text-lg font-semibold">
                    Confirm Your Booking
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Appointment Details
                    </h4>
                    <div className="space-y-3 text-md">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Service:</span>
                        <span className="font-medium">
                          {selectedService.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium">
                          {format(new Date(selectedDate), "MMMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">
                          {format(
                            new Date(`${selectedDate}T${selectedTime}:00`),
                            "h:mm a"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Artist:</span>
                        <span className="font-medium">
                          {artistData?.name || "Professional Artist"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-lg font-bold text-gray-800">
                      Total Price:
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      EGP {selectedService.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Button - ONLY show if ALL required info is provided */}
      {(() => {
        // This function acts as a safeguard to ensure all requirements are met
        const canShowBookingButton = () => {
          // All selections must be present
          if (
            !selectedService ||
            !selectedService.id ||
            !selectedDate ||
            !selectedTime
          ) {
            return false;
          }

          // The service must have a valid price
          if (!selectedService.price || selectedService.price <= 0) {
            return false;
          }

          // All conditions met
          return true;
        };

        // Only render the booking button if all conditions are met
        return canShowBookingButton() ? (
          <div className="mt-8">
            {!isUserLoggedIn && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 font-medium">
                      Please sign in to book an appointment
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href="/sign-in"
                        className="inline-block bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-1 px-3 rounded-md text-xs transition"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        className="inline-block text-amber-800 hover:underline text-xs"
                      >
                        Create account
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full py-6 text-lg bg-rose-600 hover:bg-rose-700 transition-colors"
              disabled={!isUserLoggedIn || isBooking}
              onClick={handleBookAppointment}
            >
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                </>
              ) : (
                <>
                  Proceed to Payment - EGP
                  {selectedService?.price?.toFixed(2) || "0.00"}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-500 mt-3">
              By booking, you agree to our{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/policy" className="underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-rose-400 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-rose-700">
                  Please complete all selections
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div
                    className={`px-3 py-1 rounded-md text-xs flex items-center ${
                      selectedService && selectedService.id
                        ? "bg-green-50 text-green-600"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        selectedService && selectedService.id
                          ? "bg-green-500"
                          : "bg-rose-500"
                      }`}
                    ></span>
                    Service
                  </div>

                  <div
                    className={`px-3 py-1 rounded-md text-xs flex items-center ${
                      selectedDate
                        ? "bg-green-50 text-green-600"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        selectedDate ? "bg-green-500" : "bg-rose-500"
                      }`}
                    ></span>
                    Date
                  </div>

                  <div
                    className={`px-3 py-1 rounded-md text-xs flex items-center ${
                      selectedTime
                        ? "bg-green-50 text-green-600"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        selectedTime ? "bg-green-500" : "bg-rose-500"
                      }`}
                    ></span>
                    Time
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                onClick={() => {
                  router.push("/sign-in");
                }}
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
