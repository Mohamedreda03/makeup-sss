"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addHours,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Define appointment type
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface Appointment {
  id: string;
  datetime: string;
  serviceType: string;
  duration: number;
  status: AppointmentStatus;
  user: {
    name: string | null;
  };
}

// Hours to display (10am - 12am)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 10);

export default function ArtistCalendarPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  // Redirect if not artist
  useEffect(() => {
    if (
      status === "authenticated" &&
      (session?.user as ExtendedUser)?.role !== "ARTIST"
    ) {
      router.push("/");
      toast({
        title: "Access Denied",
        description: "Only artists can access this dashboard",
        variant: "destructive",
      });
    }
  }, [session, status, router]);

  // Generate week days when current week changes
  useEffect(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start from Monday
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 }); // End on Sunday
    const days = eachDayOfInterval({ start, end });
    setWeekDays(days);
  }, [currentWeek]);

  // Fetch appointments for the current week
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session?.user || status !== "authenticated") return;

      try {
        setIsLoading(true);
        const start = format(
          startOfWeek(currentWeek, { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        const end = format(
          endOfWeek(currentWeek, { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );

        const response = await fetch(
          `/api/appointments/artist?startDate=${start}&endDate=${end}`
        );
        const data = await response.json();

        if (response.ok) {
          setAppointments(data.appointments);
        } else {
          throw new Error(data.message || "Failed to fetch appointments");
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Could not load appointments. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && status === "authenticated") {
      fetchAppointments();
    }
  }, [session, status, currentWeek]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Helper to get appointments for a specific day and hour
  const getAppointmentsForTimeSlot = (day: Date, hour: number) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.datetime);
      return (
        format(appointmentDate, "yyyy-MM-dd") === dayStr &&
        appointmentDate.getHours() === hour
      );
    });
  };

  // Format hour display (e.g., "10 AM", "2 PM")
  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  // Style for different appointment status
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Navigate to appointment details
  const viewAppointmentDetails = (appointmentId: string) => {
    router.push(`/artist-dashboard?appointmentId=${appointmentId}`);
  };

  // If loading or not authenticated
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // If not authenticated
  if (status === "unauthenticated") {
    router.push("/sign-in?callbackUrl=/artist-dashboard/calendar");
    return null;
  }

  return (
    <div className="container py-10 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendar View</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/artist-dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Weekly Schedule</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {format(weekDays[0], "MMMM d, yyyy")} -{" "}
            {format(weekDays[6], "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-1">
            {/* Time column */}
            <div className="col-span-1 pt-10">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-20 border-t text-xs text-gray-500 pt-1 pr-2 text-right"
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map((day) => (
              <div key={day.toString()} className="col-span-1">
                <div className="h-10 text-center py-2 border-b font-medium">
                  <div>{format(day, "EEE")}</div>
                  <div
                    className={`text-sm ${
                      format(day, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd")
                        ? "bg-rose-100 rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Time slots */}
                {HOURS.map((hour) => {
                  const appointmentsInSlot = getAppointmentsForTimeSlot(
                    day,
                    hour
                  );

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="h-20 border-t border-r border-gray-100 relative p-1"
                    >
                      {appointmentsInSlot.map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`text-xs mb-1 rounded px-1 py-1 cursor-pointer transition-opacity hover:opacity-90 ${getStatusColor(
                            appointment.status
                          )}`}
                          onClick={() => viewAppointmentDetails(appointment.id)}
                        >
                          <div className="font-semibold truncate">
                            {appointment.serviceType}
                          </div>
                          <div className="truncate">
                            {appointment.user.name || "Client"}
                          </div>
                          <div>
                            {format(new Date(appointment.datetime), "h:mm a")}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex space-x-4">
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              Pending
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 border-blue-200"
            >
              Confirmed
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Completed
            </Badge>
            <Badge
              variant="outline"
              className="bg-red-100 text-red-800 border-red-200"
            >
              Cancelled
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
