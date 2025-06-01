import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getDay, format, addMinutes, startOfDay, addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { createEgyptDate } from "@/lib/timezone-config";

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

// Appointment request schema for validation - simplified without timezone complexity
const appointmentRequestSchema = z.object({
  artistId: z.string(),
  serviceId: z.string().optional(),
  serviceType: z.string(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM (24-hour format)
  duration: z.number().min(15).max(240),
  totalPrice: z.number().nonnegative(),
  notes: z.string().optional(),
  location: z.string().optional().nullable(),
});

// POST /api/appointment-requests
export async function POST(req: Request) {
  try {
    console.log("Starting appointment request creation process");

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
      const validatedData = appointmentRequestSchema.parse(requestBody);
      console.log("Data validation successful:", validatedData); // Verify the artist exists and get availability settings
      const artist = await db.user.findUnique({
        where: {
          id: validatedData.artistId,
          role: "ARTIST",
        },
        include: {
          makeup_artist: true,
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

      // Get the makeup artist record for booking
      const makeupArtistRecord = await db.makeUpArtist.findFirst({
        where: {
          user_id: validatedData.artistId,
        },
        select: {
          id: true,
        },
      });

      if (!makeupArtistRecord) {
        console.log(
          `No makeup artist record found for user ID: ${validatedData.artistId}`
        );
        return NextResponse.json(
          { message: "Artist profile not found" },
          { status: 404 }
        );
      }
      console.log(`Makeup artist ID found: ${makeupArtistRecord.id}`);      // Parse date and time - using Egypt timezone for consistency
      console.log("=== PROCESSING DATE AND TIME (EGYPT TIMEZONE) ===");
      console.log("Received appointment date:", validatedData.appointmentDate);
      console.log("Received appointment time:", validatedData.appointmentTime);

      // Parse date and time components
      const [year, month, day] = validatedData.appointmentDate
        .split("-")
        .map(Number);
      const [timeHour, timeMinute] = validatedData.appointmentTime
        .split(":")
        .map(Number);

      // Create appointment datetime using Egypt timezone
      const appointmentDateTime = createEgyptDate(
        year,
        month,
        day,
        timeHour,
        timeMinute,
        0
      );

      console.log("Appointment datetime created (Egypt timezone):", {
        input: { year, month, day, timeHour, timeMinute },
        datetime: appointmentDateTime.toLocaleString(),
        utc: appointmentDateTime.toISOString(),
        egyptTime: appointmentDateTime.toLocaleString("en-US", {
          timeZone: "Africa/Cairo",
        }),
      });

      const dayOfWeek = getDay(appointmentDateTime);
      // Use the parsed time components directly instead of getHours/getMinutes to avoid timezone issues
      // const timeHour = appointmentDateTime.getHours();
      // const timeMinute = appointmentDateTime.getMinutes();

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

      console.log("=== APPOINTMENT DETAILS ===");
      console.log(
        "Appointment date/time:",
        appointmentDateTime.toLocaleString()
      );
      console.log("Day of week:", dayOfWeek);
      console.log("Time hour:", timeHour);
      console.log("Time minute:", timeMinute);

      // Parse availability settings or use defaults
      let workingHours = DEFAULT_BUSINESS_HOURS;
      let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
      let isAvailable = true; // Default to available if no settings found

      if (artist?.makeup_artist?.available_slots) {
        try {
          // available_slots is already a JSON object, no need to parse
          const settings = artist.makeup_artist.available_slots as {
            workingDays?: number[];
            startTime?: string;
            endTime?: string;
            sessionDuration?: number;
            breakBetweenSessions?: number;
            isAvailable?: boolean;
          };

          console.log("Artist availability settings retrieved:", settings);

          if (settings.startTime && settings.endTime) {
            workingHours = {
              start: parseInt(settings.startTime.split(":")[0]),
              end: parseInt(settings.endTime.split(":")[0]),
              interval: settings.sessionDuration || 30,
            };
          }
          if (settings.workingDays && Array.isArray(settings.workingDays)) {
            // Convert workingDays to regularDaysOff
            const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
            regularDaysOff = allDays.filter(
              (day) => !settings.workingDays!.includes(day)
            );
            console.log("Working days:", settings.workingDays);
            console.log("Regular days off:", regularDaysOff);
          }
          if (settings.isAvailable !== undefined) {
            isAvailable = settings.isAvailable;
          }
        } catch (error) {
          console.error("Error parsing availability settings:", error);
          // Continue with defaults
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
      } // Check if appointment is during working hours
      const appointmentEndHour = appointmentEndTime.getHours();
      const appointmentEndMinute = appointmentEndTime.getMinutes();

      console.log("=== WORKING HOURS CHECK ===");
      console.log(
        `Working hours: ${workingHours.start}:00 - ${workingHours.end}:00`
      );
      console.log(
        `Appointment start: ${timeHour}:${timeMinute
          .toString()
          .padStart(2, "0")}`
      );
      console.log(
        `Appointment end: ${appointmentEndHour}:${appointmentEndMinute
          .toString()
          .padStart(2, "0")}`
      );

      // Check if appointment start time is within working hours
      if (timeHour < workingHours.start || timeHour >= workingHours.end) {
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
      if (timeMinute % workingHours.interval !== 0) {
        console.log("Time doesn't align with scheduling intervals");
        return NextResponse.json(
          {
            message:
              "Selected time does not align with the artist's scheduling intervals",
          },
          { status: 400 }
        );
      } // Check for conflicts with existing bookings
      console.log("=== CHECKING FOR BOOKING CONFLICTS (SIMPLIFIED) ===");
      console.log(
        "Using makeup artist ID for conflict check:",
        makeupArtistRecord.id
      );
      console.log(
        "Requested appointment:",
        appointmentDateTime.toLocaleString()
      );
      console.log(
        "Requested appointment duration:",
        validatedData.duration,
        "minutes"
      );      // Query for bookings on the same date - using Egypt timezone
      const dayStart = startOfDay(appointmentDateTime);
      const dayEnd = addDays(dayStart, 1);

      console.log("Searching bookings in date range (Egypt timezone):", {
        start: dayStart.toLocaleString(),
        end: dayEnd.toLocaleString(),
        startUTC: dayStart.toISOString(),
        endUTC: dayEnd.toISOString(),
      });

      const existingBookings = await db.booking.findMany({
        where: {
          artist_id: makeupArtistRecord.id, // Use makeup artist ID, not user ID
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
      );

      // Log each existing booking for debugging (simplified)
      existingBookings.forEach((booking, index) => {
        console.log(`Existing booking ${index + 1}:`, {
          id: booking.id,
          date_time: booking.date_time.toLocaleString(),
          status: booking.booking_status,
          service: booking.service_type,
        });
      });

      // Check for overlapping bookings (simplified)
      console.log("=== CHECKING FOR TIME CONFLICTS (SIMPLIFIED) ===");

      // Fetch artist services to get accurate durations
      const artistServices = await db.artistService.findMany({
        where: {
          artistId: validatedData.artistId,
        },
        select: {
          name: true,
          duration: true,
        },
      });

      // Create mapping of service names to durations
      const serviceNameToDuration = new Map<string, number>();
      artistServices.forEach((service) => {
        serviceNameToDuration.set(service.name, service.duration);
      });
      const isOverlapping = existingBookings.some((booking) => {
        // Use existing booking datetime directly (simplified)
        const existingStart = new Date(booking.date_time);
        // Use actual service duration or default to 60 minutes
        const existingDuration =
          serviceNameToDuration.get(booking.service_type) || 60;
        const existingEnd = addMinutes(existingStart, existingDuration);

        console.log(
          `Checking conflict with booking ${booking.id} (simplified):`
        );
        console.log(
          `  Existing: ${existingStart.toLocaleString()} to ${existingEnd.toLocaleString()} (${existingDuration}min)`
        );
        console.log(
          `  New: ${appointmentDateTime.toLocaleString()} to ${appointmentEndTime.toLocaleString()} (${
            validatedData.duration
          }min)`
        );

        // Compare appointment times directly
        const hasOverlap =
          // New appointment starts during an existing appointment
          (appointmentDateTime >= existingStart &&
            appointmentDateTime < existingEnd) ||
          // New appointment ends during an existing appointment
          (appointmentEndTime > existingStart &&
            appointmentEndTime <= existingEnd) ||
          // New appointment completely contains an existing appointment
          (appointmentDateTime <= existingStart &&
            appointmentEndTime >= existingEnd) ||
          // Existing appointment completely contains the new appointment
          (existingStart <= appointmentDateTime &&
            existingEnd >= appointmentEndTime);

        console.log(`  Overlap detected: ${hasOverlap}`);

        return hasOverlap;
      });

      if (isOverlapping) {
        console.log("=== TIME SLOT CONFLICT DETECTED ===");
        console.log("Rejecting booking request due to time conflict");
        return NextResponse.json(
          {
            message:
              "This time slot is already booked. Please select a different time.",
            error: "TIME_CONFLICT",
          },
          { status: 409 } // 409 Conflict status code
        );
      }
      console.log("=== NO CONFLICTS FOUND - PROCEEDING WITH BOOKING ===");

      // Generate a temporary request ID
      const tempRequestId = uuidv4();

      // Prepare appointment data (simplified approach)
      const appointmentRequestData = {
        userId,
        artistId: validatedData.artistId,
        appointmentDate: validatedData.appointmentDate,
        appointmentTime: validatedData.appointmentTime,
        serviceType: validatedData.serviceType,
        duration: validatedData.duration,
        totalPrice: validatedData.totalPrice,
        notes: validatedData.notes || "",
        location: validatedData.location || null,
        status: "PENDING" as AppointmentStatus,
        tempId: tempRequestId,
        created: new Date(),
        artistName: artist.name || "Artist",
      };

      console.log(
        "Prepared appointment request (simplified):",
        appointmentRequestData
      );

      // Store this request data in a server-side session or temporary storage
      // For now, we'll simply return it with a temporary ID for the client to use

      return NextResponse.json({
        message: "Appointment request validated successfully",
        appointmentRequest: appointmentRequestData,
        redirectUrl: `/payment/request/${tempRequestId}`,
      });
    } catch (error: unknown) {
      console.error("Validation error:", error);
      return NextResponse.json(
        {
          message:
            error instanceof Error ? error.message : "Invalid request data",
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error creating appointment request:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
