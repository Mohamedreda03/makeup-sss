"use client";

import { useState, useEffect, useRef, MouseEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parse, isToday, isAfter, isBefore, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Calendar, Clock } from "lucide-react";
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
  description: string;
  price: number;
  duration: number;
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
  selectedService,
  isUserLoggedIn,
  availabilitySettings,
  artistData,
}: ArtistBookingProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const daysContainerRef = useRef<HTMLDivElement>(null);
  const timeSlotContainerRef = useRef<HTMLDivElement>(null);

  const [availability, setAvailability] = useState<ArtistAvailability | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  // Variables to track dragging state for time slots
  const [isTimeDragging, setIsTimeDragging] = useState(false);
  const [timeStartX, setTimeStartX] = useState(0);
  const [timeScrollLeft, setTimeScrollLeft] = useState(0);

  // Variables to track dragging state for days
  const [isDayDragging, setIsDayDragging] = useState(false);
  const [dayStartX, setDayStartX] = useState(0);
  const [dayScrollLeft, setDayScrollLeft] = useState(0);

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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = async () => {
    if (!isUserLoggedIn) {
      setShowLoginDialog(true);
      return;
    }

    if (!selectedDate || !selectedTime || !selectedService) {
      toast({
        title: "Missing Information",
        description:
          "Please select a date, time, and service to book an appointment.",
        variant: "destructive",
      });
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

      // Create appointment data
      const appointmentData = {
        artistId,
        serviceId: selectedService.id, // Add the serviceId to make sure the appointment is linked to a service
        serviceType: selectedService.name,
        datetime: datetime.toISOString(),
        duration: selectedService.duration,
        totalPrice: selectedService.price,
        notes: notes || "",
        status: "PENDING", // Ensure status is set explicitly
      };

      console.log("Sending appointment data:", appointmentData);

      // Submit to API
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.message || "Failed to book appointment");
      }

      console.log("Appointment created successfully:", data);

      // Success notification
      toast({
        title: "Appointment Booked!",
        description: "Your appointment has been successfully scheduled.",
        variant: "success",
      });

      // Reset form
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes("");

      // Redirect to appointments page
      router.push("/appointments");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Booking Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while booking your appointment",
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

  if (isLoading) {
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
    <div className="">
      <h2 className="text-2xl font-bold text-center">Book an Appointment</h2>

      {/* Date Selection */}
      {availability?.availability && availability.availability.length > 0 ? (
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
            <div className="flex space-x-4 px-4">
              {availability.availability
                // Only show days that have available time slots
                .filter(
                  (day) =>
                    day.timeSlots && day.timeSlots.length > 0 && !day.isDayOff
                )
                .map((day) => {
                  return (
                    <button
                      key={day.date}
                      onClick={() => handleDateSelect(day.date)}
                      className={`flex flex-col items-center justify-center rounded-full p-4 min-w-[80px] h-[80px] transition-colors flex-shrink-0 ${
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

      {/* Time Slots - Horizontal Scrollable with Drag */}
      {selectedDate && timeSlots.length > 0 ? (
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
                    <div className="text-center font-medium">{slot.label}</div>
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
      ) : selectedDate ? (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
          No available time slots for this day
        </div>
      ) : null}

      <div className="max-w-2xl mx-auto">
        {/* Notes Field */}
        {selectedTime && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
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

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <div className="border rounded-lg p-6 mt-8 bg-white shadow-sm">
            <h3 className="font-semibold text-xl mb-4">Appointment Summary</h3>
            <div className="space-y-3 text-md">
              {selectedService && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium">{selectedService.name}</span>
                </div>
              )}
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
              {selectedService && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Artist:</span>
                    <span className="font-medium">
                      {artistData?.name || "Professional Artist"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-medium">
                      {selectedService.duration} minutes
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
                    <span>Total Price:</span>
                    <span className="text-green-600">
                      ${selectedService.price}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Book Button */}
        {selectedDate && selectedTime && selectedService && (
          <div className="mt-8">
            {!isUserLoggedIn && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-800">
                <p className="flex items-center font-medium mb-2">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Please sign in to book an appointment
                </p>
                <p className="text-sm">
                  You need to have an account to book appointments with our
                  artists.
                </p>
                <div className="mt-3">
                  <Link
                    href="/sign-in"
                    className="inline-block bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2 px-4 rounded-md text-sm transition"
                  >
                    Sign In
                  </Link>
                  <span className="mx-2 text-sm text-amber-700">or</span>
                  <Link
                    href="/sign-up"
                    className="inline-block text-amber-800 hover:underline text-sm"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            )}

            <Button
              className="w-full py-6 text-lg"
              disabled={!isUserLoggedIn || isBooking}
              onClick={handleBookAppointment}
            >
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3">
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
        )}
      </div>

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to book an appointment with this artist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={() => {
                  router.push("/sign-in");
                }}
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
