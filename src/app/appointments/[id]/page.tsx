import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { Metadata } from "next";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { AppointmentStatus } from "@/generated/prisma";
import { PaymentButton } from "@/components/appointment/PaymentButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  return db.appointment.findUnique({
    where: {
      id,
      userId: user.id, // Ensure appointment belongs to this user
    },
    include: {
      artist: true,
      paymentDetails: true,
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

  const isPaid = appointment.paymentDetails !== null;
  const showPaymentButton =
    appointment.status === AppointmentStatus.CONFIRMED && !isPaid;

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Appointment Details</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{appointment.serviceType}</CardTitle>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <CardDescription>
            Booked on {format(new Date(appointment.createdAt), "PPP")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Date & Time
                </h3>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{format(new Date(appointment.datetime), "PPPP")}</span>
                </div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{format(new Date(appointment.datetime), "p")}</span>
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
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Duration & Price
                </h3>
                <p className="mt-1">{appointment.duration} minutes</p>
                <p className="font-semibold text-lg">
                  ${appointment.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Artist</h3>
                <div className="flex items-start space-x-3 mt-2">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {appointment.artist?.image ? (
                      <img
                        src={appointment.artist.image}
                        alt={appointment.artist?.name || "Artist"}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.artist?.name || "Artist"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.artist?.email}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-gray-700">{appointment.notes}</p>
                </div>
              )}

              {appointment.paymentDetails && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Payment Status
                  </h3>
                  <Badge
                    variant="outline"
                    className="mt-1 bg-green-100 text-green-800"
                  >
                    Paid on{" "}
                    {format(new Date(appointment.paymentDetails.paidAt), "PPP")}
                  </Badge>
                  <p className="mt-1 text-sm text-gray-500">
                    Payment method: {appointment.paymentDetails.paymentMethod}
                  </p>
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
                </p>
                <div className="mt-2">
                  <PaymentButton
                    appointmentId={appointment.id}
                    amount={appointment.totalPrice}
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
function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const statusConfig = {
    [AppointmentStatus.PENDING]: {
      color: "bg-amber-100 text-amber-800",
      label: "Pending",
    },
    [AppointmentStatus.CONFIRMED]: {
      color: "bg-blue-100 text-blue-800",
      label: "Confirmed",
    },
    [AppointmentStatus.COMPLETED]: {
      color: "bg-green-100 text-green-800",
      label: "Completed",
    },
    [AppointmentStatus.CANCELLED]: {
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
