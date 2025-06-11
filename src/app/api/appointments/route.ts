import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { format, addMinutes } from "date-fns";
import { BookingStatus } from "@/generated/prisma";
import {
  createSimpleDateTime,
  formatSimpleDateTime,
} from "@/lib/timezone-config";

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
  start: 9, // 9 AM
  end: 17, // 5 PM (17:00)
  interval: 30, // 30 minute intervals
};

// Default regular days off
const DEFAULT_REGULAR_DAYS_OFF = [0, 6]; // Sunday and Saturday

// Booking schema for validation - simplified without timezone complexity
const bookingSchema = z.object({
  artistId: z.string(),
  serviceType: z.string(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (24-hour format)
  totalPrice: z.number().nonnegative(),
  location: z.string().optional().nullable(),
  status: z
    .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"])
    .optional()
    .default("CONFIRMED"),
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
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10"); // Build filter
    const filter: {
      user_id: string;
      booking_status?: BookingStatus;
    } = {
      user_id: userId,
    };

    // Add status filter if specified
    if (status && status !== "all") {
      filter.booking_status = status.toUpperCase() as BookingStatus;
    } // Get total count for pagination
    const totalAppointments = await db.booking.count({
      where: filter,
    });

    // Get bookings
    const appointments = await db.booking.findMany({
      where: filter,
      include: {
        artist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        // Note: payment details are tracked differently in booking schema
      },
      orderBy: {
        date_time: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }); // Format response - treat stored datetime as local time (no conversion)
    const formattedAppointments = appointments.map((booking) => {
      // Check if booking is paid - payment status is tracked in booking_status
      const isPaid = booking.booking_status === "COMPLETED";

      // Treat the stored datetime as local time directly (no timezone conversion)
      // Since we store in local time, we should return it as local time
      return {
        id: booking.id,
        datetime: booking.date_time, // Return as-is (already local time)
        description: booking.service_type, // Use service_type as description
        status: booking.booking_status,
        serviceType: booking.service_type,
        totalPrice: booking.total_price,
        location: booking.location,
        createdAt: booking.createdAt,
        artistId: booking.artist_id,
        artistName: booking.artist?.user?.name || null,
        artistImage: booking.artist?.user?.image || null,
        isPaid,
        paymentDetails: null, // Payment details handled differently in booking schema
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
      const validatedData = bookingSchema.parse(requestBody);
      console.log("Data validation successful:", validatedData); // Verify the artist exists and get makeup artist data
      const artist = await db.user.findUnique({
        where: {
          id: validatedData.artistId,
          role: "ARTIST",
        },
        include: {
          makeup_artist: true,
        },
      });

      if (!artist || !artist.makeup_artist) {
        console.log(`Artist not found: ${validatedData.artistId}`);
        return NextResponse.json(
          { message: "Artist not found" },
          { status: 404 }
        );
      }
      console.log(`Artist verified: ${artist.name || artist.id}`);

      // Simple local time approach
      console.log("=== SIMPLE LOCAL TIME PROCESSING ===");
      console.log("Received appointmentDate:", validatedData.appointmentDate);
      console.log("Received appointmentTime:", validatedData.appointmentTime);

      // Create appointment datetime using simple local time
      const appointmentDateTime = createSimpleDateTime(
        validatedData.appointmentDate,
        validatedData.appointmentTime
      );

      console.log(
        "Local date/time input:",
        `${validatedData.appointmentDate} ${validatedData.appointmentTime}`
      );
      console.log(
        "Created local datetime object:",
        appointmentDateTime.toISOString()
      );

      const dayOfWeek = appointmentDateTime.getDay();
      const appointmentEndTime = addMinutes(appointmentDateTime, 60); // Default duration

      console.log(
        `Appointment time: ${format(
          appointmentDateTime,
          "yyyy-MM-dd HH:mm"
        )} to ${format(appointmentEndTime, "HH:mm")}`
      );

      // Parse availability settings or use defaults
      let workingHours = DEFAULT_BUSINESS_HOURS;
      let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
      let isAvailable = true; // Default to available if no settings found

      if (artist.makeup_artist.available_slots) {
        const storedSettings = artist.makeup_artist.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          startTimeUTC?: string;
          endTimeUTC?: string;
          sessionDuration?: number;
          breakBetweenSessions?: number;
          isAvailable?: boolean;
        }; // Simple approach: use times directly as local time
        let startTime = storedSettings.startTime || "09:00";
        let endTime = storedSettings.endTime || "17:00";

        // Convert the times to the old format for compatibility
        if (startTime && endTime) {
          const startHour = parseInt(startTime.split(":")[0]);
          const endHour = parseInt(endTime.split(":")[0]);
          workingHours = {
            start: startHour,
            end: endHour,
            interval: storedSettings.sessionDuration || 30,
          };
        }

        // Convert workingDays to regularDaysOff
        if (storedSettings.workingDays) {
          const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
          regularDaysOff = allDays.filter(
            (day) => !storedSettings.workingDays!.includes(day)
          );
        }

        // Get the artist's overall availability status
        if (storedSettings.isAvailable !== undefined) {
          isAvailable = storedSettings.isAvailable;
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

      // Check if appointment is during working hours (local timezone)
      // Since appointmentDateTime is in local time, use it directly
      const localHours = appointmentDateTime.getHours();
      const localMinutes = appointmentDateTime.getMinutes();

      const appointmentEndHour = appointmentEndTime.getHours();
      const appointmentEndMinute = appointmentEndTime.getMinutes();
      console.log("=== WORKING HOURS CHECK (LOCAL TIMEZONE) ===");
      console.log(
        `Working hours: ${workingHours.start}:00 - ${workingHours.end}:00`
      );
      console.log(
        `Appointment start (Local): ${localHours}:${localMinutes
          .toString()
          .padStart(2, "0")}`
      );
      console.log(
        `Appointment end (Local): ${appointmentEndHour}:${appointmentEndMinute
          .toString()
          .padStart(2, "0")}`
      );

      // Check if appointment start time is within working hours
      if (localHours < workingHours.start || localHours >= workingHours.end) {
        console.log("Appointment start time is outside working hours");
        return NextResponse.json(
          { message: "Selected time is outside the artist's working hours" },
          { status: 400 }
        );
      } // Check if appointment end time is within working hours
      // Allow appointments that start within working hours, even if they extend slightly beyond
      // This fixes the issue where last available time slots couldn't be booked
      if (
        appointmentEndHour > workingHours.end + 1 || // Allow up to 1 hour past working hours
        (appointmentEndHour === workingHours.end + 1 &&
          appointmentEndMinute > 30) // Allow max 30 min extension at end+1 hour
      ) {
        console.log("Appointment end time exceeds working hours");
        return NextResponse.json(
          {
            message:
              "Selected appointment duration exceeds the artist's working hours",
          },
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
      } // Check if the time slot is properly aligned with the artist's interval settings
      if (localMinutes % workingHours.interval !== 0) {
        console.log("Time doesn't align with scheduling intervals");
        return NextResponse.json(
          {
            message:
              "Selected time does not align with the artist's scheduling intervals",
          },
          { status: 400 }
        );
      } // Check for conflicts with existing bookings - local time approach
      console.log("=== CHECKING FOR BOOKING CONFLICTS (LOCAL TIME) ===");
      console.log(
        "Using makeup artist ID for conflict check:",
        artist.makeup_artist.id
      );
      console.log(
        "Requested appointment datetime (Local):",
        appointmentDateTime.toISOString()
      );
      console.log(
        "Requested appointment datetime (Local display):",
        appointmentDateTime.toLocaleString("en-US")
      ); // Create day range for conflict checking (local timezone)
      // Since we store in local time, create range in local time
      const dayStart = new Date(appointmentDateTime);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(appointmentDateTime);
      dayEnd.setHours(23, 59, 59, 999);

      console.log("Searching bookings in local time range:", {
        start: dayStart.toISOString(),
        end: dayEnd.toISOString(),
        requestedTime: appointmentDateTime.toISOString(),
      });
      const existingBookings = await db.booking.findMany({
        where: {
          artist_id: artist.makeup_artist.id,
          booking_status: {
            in: ["PENDING", "CONFIRMED"],
          },
          date_time: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        select: {
          id: true,
          date_time: true,
          booking_status: true,
          service_type: true,
        },
      });

      console.log(
        `Found ${existingBookings.length} existing bookings for the day`
      ); // Check for time conflicts - direct comparison since both are local time
      const requestedTime = appointmentDateTime.getTime();

      console.log("=== SIMPLIFIED CONFLICT CHECK ===");
      console.log(
        "Requested appointment time:",
        appointmentDateTime.toISOString()
      );

      const isOverlapping = existingBookings.some((booking) => {
        const existingTime = booking.date_time.getTime();

        console.log(`Comparing with existing booking ${booking.id}:`);
        console.log(`  Existing: ${booking.date_time.toISOString()}`);
        console.log(`  Requested: ${appointmentDateTime.toISOString()}`);

        // Direct time comparison (both in local time)
        const isConflict = Math.abs(existingTime - requestedTime) < 60000; // Within 1 minute
        console.log(`  Conflict: ${isConflict}`);

        return isConflict;
      });

      if (isOverlapping) {
        console.log("=== TIME SLOT CONFLICT DETECTED ===");
        console.log("Rejecting booking request due to time conflict");
        return NextResponse.json(
          {
            message:
              "This time slot is already booked. Please select a different time.",
          },
          { status: 409 }
        );
      } // Create the booking
      const bookingData = {
        user_id: userId,
        artist_id: artist.makeup_artist.id, // Use makeup_artist.id instead of user.id
        date_time: appointmentDateTime, // Store as local time (no conversion)
        service_type: validatedData.serviceType,
        total_price: validatedData.totalPrice,
        location: validatedData.location || null,
        booking_status: validatedData.status || "CONFIRMED",
      };

      console.log("Preparing to create booking:", {
        ...bookingData,
        date_time: {
          localTime: bookingData.date_time.toISOString(),
          localDisplay: bookingData.date_time.toLocaleString(),
          hours: bookingData.date_time.getHours(),
        },
      });

      // Save to database
      const booking = await db.booking.create({ data: bookingData });

      console.log(`Booking created with ID: ${booking.id}`);

      // Return the created booking
      return NextResponse.json({
        message: "Appointment created successfully",
        appointment: {
          id: booking.id,
          datetime: booking.date_time,
          serviceType: booking.service_type,
          status: booking.booking_status,
          totalPrice: booking.total_price,
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
