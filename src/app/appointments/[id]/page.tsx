import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { toEgyptTime } from "@/lib/timezone-config";
import { Metadata } from "next";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { BookingStatus } from "@/generated/prisma";
import { PaymentButton } from "@/components/appointment/PaymentButton";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Appointment Details",
  description: "View your appointment details",
};

async function getAppointmentDetails(id: string) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return null;
  // Get appointment with artist details
  return db.booking.findUnique({
    where: {
      id,
      user_id: user.id, // Ensure appointment belongs to this user
    },
    include: {
      artist: {
        include: {
          user: true,
        },
      },
    },
  });
}

export default async function AppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  const appointment = await getAppointmentDetails(params.id);

  if (!appointment) {
    return notFound();
  }
  const isPaid = appointment.booking_status === "COMPLETED";
  const showPaymentButton =
    appointment.booking_status === BookingStatus.CONFIRMED && !isPaid;

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Appointment Details</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <AppointmentStatusBadge status={appointment.booking_status} />
          </div>{" "}
          <CardDescription>
            Booked on{" "}
            {(() => {
              try {
                const createdDate = new Date(appointment.createdAt);
                if (isNaN(createdDate.getTime())) {
                  return "Unknown date";
                }
                return format(toEgyptTime(createdDate), "PPP");
              } catch {
                return "Date not available";
              }
            })()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {" "}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Date & Time
                </h3>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />{" "}
                  <span>
                    {(() => {
                      try {
                        // Handle the date/time properly to avoid timezone issues
                        const appointmentDate = new Date(appointment.date_time);

                        // Check if the date is valid
                        if (isNaN(appointmentDate.getTime())) {
                          return "Invalid Date";
                        }

                        return format(
                          toEgyptTime(appointmentDate),
                          "EEEE, MMMM d, yyyy"
                        );
                      } catch {
                        return "Date not available";
                      }
                    })()}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />{" "}
                  <span>
                    {(() => {
                      try {
                        // Handle the time properly to avoid timezone issues
                        const appointmentDate = new Date(appointment.date_time);

                        // Check if the date is valid
                        if (isNaN(appointmentDate.getTime())) {
                          return "Invalid Time";
                        }

                        return format(toEgyptTime(appointmentDate), "h:mm a");
                      } catch {
                        return "Time not available";
                      }
                    })()}
                  </span>
                </div>
              </div>
              {appointment.location && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Location
                  </h3>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
              )}{" "}
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Service & Price
                </h3>{" "}
                <p className="mt-1">{appointment.service_type}</p>{" "}
                <p className="font-semibold text-lg">
                  ${appointment.total_price?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Artist</h3>{" "}
                <div className="flex items-start space-x-3 mt-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {appointment.artist?.user?.image ? (
                      <Image
                        src={appointment.artist.user.image}
                        alt={appointment.artist?.user?.name || "Artist"}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.artist?.user?.name || "Artist"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.artist?.user?.email}
                    </p>
                  </div>
                </div>{" "}
              </div>

              {appointment.booking_status === "COMPLETED" && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Payment Status
                  </h3>
                  <Badge
                    variant="outline"
                    className="mt-1 bg-green-100 text-green-800"
                  >
                    Completed
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {showPaymentButton && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Payment</h3>
                <p className="text-sm text-gray-500">
                  Your payment will go directly to the artist and your
                  appointment will be marked as completed.
                </p>{" "}
                <div className="mt-2">
                  {" "}
                  <PaymentButton
                    appointmentId={appointment.id}
                    amount={appointment.total_price || 0}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/appointments">Back to Appointments</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper component for status badge
function AppointmentStatusBadge({ status }: { status: BookingStatus }) {
  const statusConfig = {
    [BookingStatus.PENDING]: {
      color: "bg-amber-100 text-amber-800",
      label: "Pending",
    },
    [BookingStatus.CONFIRMED]: {
      color: "bg-blue-100 text-blue-800",
      label: "Confirmed",
    },
    [BookingStatus.COMPLETED]: {
      color: "bg-green-100 text-green-800",
      label: "Completed",
    },
    [BookingStatus.CANCELLED]: {
      color: "bg-red-100 text-red-800",
      label: "Cancelled",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}
