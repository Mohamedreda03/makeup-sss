"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ReviewForm } from "@/components/reviews/ReviewForm";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Data type definitions
interface Appointment {
  id: string;
  datetime: string;
  description: string | null;
  status: AppointmentStatus;
  userId: string;
  artistId: string | null;
  artistName?: string | null;
  artistImage?: string | null;
  serviceType: string;
  duration: number;
  totalPrice: number;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  hasReview?: boolean;
  isPaid?: boolean;
}

enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Fetch appointments
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/appointments");
        if (!response.ok) throw new Error("Failed to fetch appointments");

        const data = await response.json();

        // Extract appointments from the response structure
        // The API returns { appointments: [...], pagination: {...} }
        const appointmentsData = Array.isArray(data)
          ? data
          : data.appointments || [];

        // Check which completed appointments have reviews
        const appointmentsWithReviewStatus = await Promise.all(
          appointmentsData.map(async (appointment: Appointment) => {
            if (appointment.status === "COMPLETED") {
              const reviewResponse = await fetch(
                `/api/reviews?appointmentId=${appointment.id}`
              );
              const reviewData = await reviewResponse.json();
              return { ...appointment, hasReview: reviewData.length > 0 };
            }
            return { ...appointment, hasReview: false };
          })
        );

        setAppointments(appointmentsWithReviewStatus);
        setFilteredAppointments(appointmentsWithReviewStatus);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchAppointments();
    }
  }, [session]);

  // Filter appointments
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter(
          (appointment) => appointment.status === activeFilter
        )
      );
    }
  }, [activeFilter, appointments]);

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CANCELLED",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to cancel appointment");

      // Update local state
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, status: "CANCELLED" as AppointmentStatus }
            : appointment
        )
      );

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled",
        variant: "success",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      setSelectedAppointment(null);
    }
  };

  // Group appointments by status for better organization
  const pendingAppointments = filteredAppointments.filter(
    (appointment) =>
      appointment.status === "PENDING" || appointment.status === "CONFIRMED"
  );

  const completedAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  );

  const cancelledAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === "CANCELLED"
  );

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please sign in to view your appointments</p>
          <Button className="mt-4">Sign In</Button>
        </div>
      </div>
    );
  }

  // Loading state UI
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Appointments</h1>

        <div className="mb-8">
          <Skeleton className="h-10 w-full max-w-md mb-8" />
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Appointments</h1>

      {/* Filter tabs */}
      <div className="mb-8">
        <Tabs
          value={activeFilter}
          onValueChange={setActiveFilter}
          className="w-full"
        >
          <TabsList className="mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Confirmed</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pending Appointments */}
      {pendingAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Upcoming Appointments</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="overflow-hidden border-rose-100 shadow-sm hover:shadow transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base text-rose-700">
                        {appointment.serviceType}
                      </h3>
                      <p className="text-gray-600 flex items-center text-sm">
                        <User className="h-3 w-3 mr-1 inline" />
                        {appointment.artistName || "Unknown Artist"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        appointment.status === "CONFIRMED"
                          ? "success"
                          : "default"
                      }
                      className="px-2 py-0.5 text-xs font-medium"
                    >
                      {appointment.status.charAt(0) +
                        appointment.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2 rounded-md mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1 text-gray-500" />
                      <span>${appointment.totalPrice}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2">
                    {appointment.status === "CONFIRMED" &&
                      !appointment.isPaid && (
                        <Button
                          className="text-xs px-2 py-1 h-auto bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            // Redirect to payment page
                            window.location.href = `/payment/${appointment.id}`;
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay Now
                        </Button>
                      )}

                    {appointment.status === "CONFIRMED" &&
                      appointment.isPaid && (
                        <Badge
                          variant="success"
                          className="px-2 py-0.5 text-xs font-medium"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}

                    {(appointment.status === "PENDING" ||
                      appointment.status === "CONFIRMED") && (
                      <Button
                        variant="destructive"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowCancelDialog(true);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Appointments */}
      {completedAppointments.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">
            Completed Appointments
          </h2>

          <div className="space-y-6">
            {completedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden hover:shadow transition-all"
              >
                {/* Appointment details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {appointment.artistImage ? (
                        <Image
                          src={appointment.artistImage}
                          alt={appointment.artistName || "Artist"}
                          width={48}
                          height={48}
                          className="rounded-full mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mr-4">
                          <User className="h-6 w-6 text-rose-500" />
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold text-lg text-rose-700">
                          {appointment.serviceType}
                        </h3>
                        <p className="text-gray-600 flex items-center">
                          <User className="h-3 w-3 mr-1 inline" />
                          {appointment.artistName || "Unknown Artist"}
                        </p>
                      </div>
                    </div>

                    <Badge variant="success" className="px-3 py-1">
                      Completed
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-md mt-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "MMMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "h:mm a")}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span>${appointment.totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Review section */}
                {!appointment.hasReview && (
                  <div className="border-t p-6 bg-gray-50">
                    <ReviewForm
                      appointmentId={appointment.id}
                      serviceName={appointment.serviceType}
                      artistName={appointment.artistName || "Artist"}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {cancelledAppointments.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">
            Cancelled Appointments
          </h2>
          <div className="grid gap-6">
            {cancelledAppointments.map((appointment) => (
              <Card
                key={appointment.id}
                className="overflow-hidden opacity-80 border-red-100 hover:opacity-100 transition-opacity"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-rose-700">
                        {appointment.serviceType}
                      </h3>
                      <p className="text-gray-600 flex items-center">
                        <User className="h-3 w-3 mr-1 inline" />
                        {appointment.artistName || "Unknown Artist"}
                      </p>
                    </div>
                    <Badge variant="destructive" className="px-3 py-1">
                      Cancelled
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>
                        {format(new Date(appointment.datetime), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                      <span>${appointment.totalPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No appointments message */}
      {appointments.length === 0 && !isLoading && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-rose-400" />
            </div>
            <h3 className="text-2xl font-medium mb-3 text-gray-800">
              No Appointments Yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              You haven't booked any appointments yet. Browse our talented
              artists and book your first appointment today.
            </p>
            <Link href="/artists">
              <Button className="bg-rose-600 hover:bg-rose-700">
                Browse Artists
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              className="bg-destructive text-destructive-foreground"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
