import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  getDay,
  parseISO,
  format,
  addMinutes,
  isWithinInterval,
} from "date-fns";
import { Appointment } from "@/generated/prisma";

// Define status type
type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Default business hours if none are set
const DEFAULT_BUSINESS_HOURS = {
  start: 10, // 10 AM
  end: 24, // 12 AM (midnight)
  interval: 30, // 30 minute intervals
};

// Default regular days off
const DEFAULT_REGULAR_DAYS_OFF = [0, 6]; // Sunday and Saturday

// Appointment schema for validation
const appointmentSchema = z.object({
  artistId: z.string(),
  serviceId: z.string().optional(),
  serviceType: z.string(),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3}Z)?$/),
  duration: z.number().min(15).max(240),
  totalPrice: z.number().nonnegative(),
  notes: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
});

// GET /api/appointments
export async function GET(req: Request) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const userId = user.id;

    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // Build filter
    const filter: any = {
      userId,
    };

    // Add status filter if specified
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    // Get total count for pagination
    const totalAppointments = await db.appointment.count({
      where: filter,
    });

    // Get appointments
    const appointments = await db.appointment.findMany({
      where: filter,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        paymentDetails: true,
      },
      orderBy: {
        datetime: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format response
    const formattedAppointments = appointments.map((appointment: any) => {
      // Check if appointment is paid
      let isPaid = false;
      if (appointment.paymentDetails) {
        isPaid = appointment.paymentDetails.status === "COMPLETED";
      }

      return {
        id: appointment.id,
        datetime: appointment.datetime,
        description: appointment.description,
        status: appointment.status,
        serviceType: appointment.serviceType,
        duration: appointment.duration,
        totalPrice: appointment.totalPrice,
        location: appointment.location,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        artistId: appointment.artistId,
        artistName: appointment.artist?.name || null,
        artistImage: appointment.artist?.image || null,
        isPaid,
        paymentDetails: appointment.paymentDetails,
      };
    });

    return NextResponse.json({
      appointments: formattedAppointments,
      pagination: {
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / pageSize),
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/appointments
export async function POST(req: Request) {
  try {
    console.log("Starting appointment creation process");

    // Verify user is authenticated
    const session = await auth();

    if (!session?.user) {
      console.log("Authentication failed: no session found");
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const userId = user.id;
    console.log(`User authenticated: ${userId}`);

    // Parse and validate request body
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);

    try {
      const validatedData = appointmentSchema.parse(requestBody);
      console.log("Data validation successful:", validatedData);

      // Verify the artist exists
      const artist = await db.user.findUnique({
        where: {
          id: validatedData.artistId,
          role: "ARTIST",
        },
      });

      if (!artist) {
        console.log(`Artist not found: ${validatedData.artistId}`);
        return NextResponse.json(
          { message: "Artist not found" },
          { status: 404 }
        );
      }
      console.log(`Artist verified: ${artist.name || artist.id}`);

      // Parse the datetime
      const appointmentDateTime = new Date(validatedData.datetime);
      const appointmentEndTime = addMinutes(
        appointmentDateTime,
        validatedData.duration
      );
      console.log(
        `Appointment time: ${format(
          appointmentDateTime,
          "yyyy-MM-dd HH:mm"
        )} to ${format(appointmentEndTime, "HH:mm")}`
      );

      // Get the day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = getDay(appointmentDateTime);
      const dateString = format(appointmentDateTime, "yyyy-MM-dd");
      const timeHour = appointmentDateTime.getHours();
      const timeMinute = appointmentDateTime.getMinutes();

      // Fetch artist's availability settings
      const artistMetadata = await db.userMetadata.findUnique({
        where: {
          userId: validatedData.artistId,
        },
      });

      // Parse availability settings or use defaults
      let workingHours = DEFAULT_BUSINESS_HOURS;
      let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
      let isAvailable = true; // Default to available if no settings found

      if (artistMetadata?.availabilitySettings) {
        const settings = JSON.parse(artistMetadata.availabilitySettings);
        workingHours = settings.workingHours || DEFAULT_BUSINESS_HOURS;
        regularDaysOff = settings.regularDaysOff || DEFAULT_REGULAR_DAYS_OFF;

        // Get the artist's overall availability status
        if (settings.isAvailable !== undefined) {
          isAvailable = settings.isAvailable;
        }
      }
      console.log("Artist availability settings retrieved");

      // Check if artist is accepting bookings
      if (!isAvailable) {
        console.log("Artist is not accepting bookings");
        return NextResponse.json(
          { message: "This artist is not currently accepting bookings" },
          { status: 400 }
        );
      }

      // Check if appointment is during working hours
      if (
        timeHour < workingHours.start ||
        timeHour >= workingHours.end ||
        (timeHour === workingHours.end - 1 &&
          timeMinute + validatedData.duration > 60)
      ) {
        console.log("Selected time is outside working hours");
        return NextResponse.json(
          { message: "Selected time is outside the artist's working hours" },
          { status: 400 }
        );
      }

      // Check if it's the artist's day off
      if (regularDaysOff.includes(dayOfWeek)) {
        console.log("Selected day is artist's day off");
        return NextResponse.json(
          { message: "Selected day is the artist's day off" },
          { status: 400 }
        );
      }

      // Check if the time slot is properly aligned with the artist's interval settings
      if (timeMinute % workingHours.interval !== 0) {
        console.log("Time doesn't align with scheduling intervals");
        return NextResponse.json(
          {
            message:
              "Selected time does not align with the artist's scheduling intervals",
          },
          { status: 400 }
        );
      }

      // Check for conflicts with existing appointments
      const existingAppointments = await db.appointment.findMany({
        where: {
          artistId: validatedData.artistId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          datetime: {
            gte: new Date(new Date(dateString).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(dateString).setHours(24, 0, 0, 0)),
          },
        },
      });

      console.log(
        `Found ${existingAppointments.length} existing appointments for the day`
      );

      // Check for overlapping appointments
      const isOverlapping = existingAppointments.some((appointment: any) => {
        const existingStart = new Date(appointment.datetime);
        const existingEnd = addMinutes(existingStart, appointment.duration);

        return (
          (appointmentDateTime >= existingStart &&
            appointmentDateTime < existingEnd) ||
          (appointmentEndTime > existingStart &&
            appointmentEndTime <= existingEnd) ||
          (appointmentDateTime <= existingStart &&
            appointmentEndTime >= existingEnd)
        );
      });

      if (isOverlapping) {
        console.log("Time slot is already booked");
        return NextResponse.json(
          { message: "This time slot is already booked" },
          { status: 400 }
        );
      }

      // Create the appointment
      const appointmentData = {
        userId,
        artistId: validatedData.artistId,
        datetime: appointmentDateTime,
        serviceType: validatedData.serviceType,
        duration: validatedData.duration,
        totalPrice: validatedData.totalPrice,
        notes: validatedData.notes || "",
        location: validatedData.location || null,
        status: validatedData.status || "PENDING",
      };

      console.log("Preparing to create appointment:", appointmentData);

      // Save to database
      const appointment = await db.appointment.create({
        data: appointmentData,
      });

      console.log(`Appointment created with ID: ${appointment.id}`);

      // Return the created appointment
      return NextResponse.json({
        message: "Appointment created successfully",
        appointment: {
          id: appointment.id,
          datetime: appointment.datetime,
          serviceType: appointment.serviceType,
          status: appointment.status,
          duration: appointment.duration,
          totalPrice: appointment.totalPrice,
        },
      });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        {
          message: "Invalid appointment data",
          errors:
            validationError instanceof z.ZodError
              ? validationError.errors
              : [{ message: "Data validation failed" }],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { message: "Failed to create appointment", error: String(error) },
      { status: 500 }
    );
  }
}
