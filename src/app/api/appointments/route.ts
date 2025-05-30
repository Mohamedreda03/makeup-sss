import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getDay, format, parseISO, addMinutes } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { BookingStatus } from "@/generated/prisma";

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

// Target timezone - must match the availability API
const TIMEZONE = "Africa/Cairo"; // المنطقة الزمنية الأساسية

// Booking schema for validation
const bookingSchema = z.object({
  artistId: z.string(),
  serviceType: z.string(),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?$/),
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
    }); // Format response
    const formattedAppointments = appointments.map((booking) => {
      // Check if booking is paid - payment status is tracked in booking_status
      const isPaid = booking.booking_status === "COMPLETED";

      return {
        id: booking.id,
        datetime: booking.date_time,
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
      }      console.log(`Artist verified: ${artist.name || artist.id}`);      // Parse the datetime with timezone handling - same as appointment-requests API
      console.log("=== TIMEZONE PROCESSING ===");
      console.log("Server timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log("Target timezone:", TIMEZONE);
      console.log("Received datetime:", validatedData.datetime);

      // Parse the ISO string directly - it should already be in the correct timezone
      const appointmentDateTime = parseISO(validatedData.datetime);
      console.log(
        "Parsed datetime (ISO):",
        appointmentDateTime.toISOString()
      );
      
      // The datetime is already in the correct timezone, so we use it directly
      // No need for additional timezone conversion since the frontend sends it correctly formatted
      const appointmentDateTimeUTC = appointmentDateTime;
      console.log("Using datetime as UTC:", appointmentDateTimeUTC.toISOString());

      // Use target timezone for local calculations
      const localDateTime = toZonedTime(appointmentDateTimeUTC, TIMEZONE);
      const dayOfWeek = getDay(localDateTime);
      const timeHour = localDateTime.getHours();
      const timeMinute = localDateTime.getMinutes();

      console.log("=== LOCAL TIME ANALYSIS ===");
      console.log("Local date/time:", localDateTime.toLocaleString());
      console.log("Day of week:", dayOfWeek);
      console.log("Time hour:", timeHour);
      console.log("Time minute:", timeMinute);

      const appointmentEndTime = addMinutes(localDateTime, 60); // Default duration
      console.log(
        `Appointment time: ${format(localDateTime, "yyyy-MM-dd HH:mm")} to ${format(appointmentEndTime, "HH:mm")}`
      );// Parse availability settings or use defaults
      let workingHours = DEFAULT_BUSINESS_HOURS;
      let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
      let isAvailable = true; // Default to available if no settings found

      if (artist.makeup_artist.available_slots) {
        const settings = artist.makeup_artist.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          sessionDuration?: number;
          breakBetweenSessions?: number;
          isAvailable?: boolean;
        };

        // Convert the new format to the old format for compatibility
        if (settings.startTime && settings.endTime) {
          const startHour = parseInt(settings.startTime.split(":")[0]);
          const endHour = parseInt(settings.endTime.split(":")[0]);
          workingHours = {
            start: startHour,
            end: endHour,
            interval: settings.sessionDuration || 30,
          };
        }

        // Convert workingDays to regularDaysOff
        if (settings.workingDays) {
          const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
          regularDaysOff = allDays.filter(
            (day) => !settings.workingDays!.includes(day)
          );
        }

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
      }      // Check if appointment is during working hours
      const appointmentEndHour = appointmentEndTime.getHours();
      const appointmentEndMinute = appointmentEndTime.getMinutes();
      
      console.log("=== WORKING HOURS CHECK ===");
      console.log(`Working hours: ${workingHours.start}:00 - ${workingHours.end}:00`);
      console.log(`Appointment start: ${timeHour}:${timeMinute.toString().padStart(2, '0')}`);
      console.log(`Appointment end: ${appointmentEndHour}:${appointmentEndMinute.toString().padStart(2, '0')}`);
      
      // Check if appointment start time is within working hours
      if (timeHour < workingHours.start || timeHour >= workingHours.end) {
        console.log("Appointment start time is outside working hours");
        return NextResponse.json(
          { message: "Selected time is outside the artist's working hours" },
          { status: 400 }
        );
      }
      
      // Check if appointment end time is within working hours
      if (appointmentEndHour > workingHours.end || 
          (appointmentEndHour === workingHours.end && appointmentEndMinute > 0)) {
        console.log("Appointment end time exceeds working hours");
        return NextResponse.json(
          { message: "Selected appointment duration exceeds the artist's working hours" },
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
      }      // Check for conflicts with existing bookings using UTC time
      console.log("=== CHECKING FOR BOOKING CONFLICTS WITH TIMEZONE ===");
      console.log("Using makeup artist ID for conflict check:", artist.makeup_artist.id);
      console.log("Requested appointment (UTC):", appointmentDateTimeUTC.toISOString());
      console.log("Requested appointment (local):", localDateTime.toLocaleString());

      // Check for same day bookings in UTC
      const dayStartUTC = new Date(appointmentDateTimeUTC);
      dayStartUTC.setUTCHours(0, 0, 0, 0);
      const dayEndUTC = new Date(appointmentDateTimeUTC);
      dayEndUTC.setUTCHours(23, 59, 59, 999);

      console.log("Searching bookings in UTC range:", {
        start: dayStartUTC.toISOString(),
        end: dayEndUTC.toISOString(),
      });

      const existingBookings = await db.booking.findMany({
        where: {
          artist_id: artist.makeup_artist.id,
          booking_status: {
            in: ["PENDING", "CONFIRMED"],
          },
          date_time: {
            gte: dayStartUTC,
            lt: dayEndUTC,
          },
        },
        select: {
          id: true,
          date_time: true,
          booking_status: true,
          service_type: true,
        },
      });

      console.log(`Found ${existingBookings.length} existing bookings for the day`);

      // Check for time conflicts using local time comparison
      const isOverlapping = existingBookings.some((booking) => {
        const existingLocalTime = toZonedTime(new Date(booking.date_time), TIMEZONE);
        const existingTimeStr = format(existingLocalTime, 'HH:mm');
        const newTimeStr = format(localDateTime, 'HH:mm');
        
        console.log(`Comparing new ${newTimeStr} with existing ${existingTimeStr}`);
        
        return existingTimeStr === newTimeStr;
      });

      if (isOverlapping) {
        console.log("=== TIME SLOT CONFLICT DETECTED ===");
        console.log("Rejecting booking request due to time conflict");
        return NextResponse.json(
          { message: "This time slot is already booked. Please select a different time." },
          { status: 409 }
        );
      }      // Create the booking
      const bookingData = {
        user_id: userId,
        artist_id: artist.makeup_artist.id, // Use makeup_artist.id instead of user.id
        date_time: appointmentDateTimeUTC, // Store in UTC
        service_type: validatedData.serviceType,
        total_price: validatedData.totalPrice,
        location: validatedData.location || null,
        booking_status: validatedData.status || "CONFIRMED",
      };

      console.log("Preparing to create booking:", {
        ...bookingData,
        date_time: bookingData.date_time.toISOString(), // Log as ISO string
      });

      // Save to database
      const booking = await db.booking.create({
        data: bookingData,
      });

      console.log(`Booking created with ID: ${booking.id}`); // Return the created booking
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
