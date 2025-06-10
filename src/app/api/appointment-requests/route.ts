import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getDay, format, addMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  createEgyptDate,
  toEgyptTime,
  isSameDayInEgypt,
  convertWorkingHoursFromUTC,
  createEgyptDateTime,
  displayEgyptDateTime,
} from "@/lib/timezone-config";

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
  start: 9, // 9 AM
  end: 17, // 5 PM (17:00)
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
      console.log(`Makeup artist ID found: ${makeupArtistRecord.id}`);

      // Parse date and time using Egypt timezone for consistency
      console.log("Processing date and time in Egypt timezone");
      console.log("Received appointment date:", validatedData.appointmentDate);
      console.log("Received appointment time:", validatedData.appointmentTime);

      // Parse date and time components
      const [year, month, day] = validatedData.appointmentDate
        .split("-")
        .map(Number);
      const [timeHour, timeMinute] = validatedData.appointmentTime
        .split(":")
        .map(Number); // Create appointment datetime using Egypt timezone for storage
      const appointmentDateTime = createEgyptDateTime(
        validatedData.appointmentDate,
        validatedData.appointmentTime
      );
      console.log(
        "Appointment datetime created in Egypt timezone for storage:",
        {
          datetime: displayEgyptDateTime(appointmentDateTime),
          storage: appointmentDateTime.toISOString(),
        }
      );

      const dayOfWeek = getDay(appointmentDateTime);
      const appointmentEndTime = addMinutes(
        appointmentDateTime,
        validatedData.duration
      );
      console.log(
        `Appointment time: ${format(
          appointmentDateTime,
          "yyyy-MM-dd HH:mm"
        )} to ${format(appointmentEndTime, "HH:mm")} (Egypt timezone)`
      );

      // Parse availability settings or use defaults
      let workingHours = DEFAULT_BUSINESS_HOURS;
      let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
      let isAvailable = true; // Default to available if no settings found

      if (artist?.makeup_artist?.available_slots) {
        try {
          // available_slots is already a JSON object, no need to parse
          const storedSettings = artist.makeup_artist.available_slots as {
            workingDays?: number[];
            startTime?: string;
            endTime?: string;
            startTimeUTC?: string;
            endTimeUTC?: string;
            sessionDuration?: number;
            breakBetweenSessions?: number;
            isAvailable?: boolean;
          };

          console.log(
            "Artist availability settings retrieved:",
            storedSettings
          );

          // Check if we have UTC times and convert them, otherwise use Egypt times directly
          let startTime = storedSettings.startTime || "09:00";
          let endTime = storedSettings.endTime || "17:00";

          if (storedSettings.startTimeUTC && storedSettings.endTimeUTC) {
            // Convert from UTC storage to Egypt timezone for processing
            const convertedTimes = convertWorkingHoursFromUTC(
              storedSettings.startTimeUTC,
              storedSettings.endTimeUTC
            );
            startTime = convertedTimes.startTime;
            endTime = convertedTimes.endTime;
          }

          if (startTime && endTime) {
            workingHours = {
              start: parseInt(startTime.split(":")[0]),
              end: parseInt(endTime.split(":")[0]),
              interval: storedSettings.sessionDuration || 30,
            };
          }
          if (
            storedSettings.workingDays &&
            Array.isArray(storedSettings.workingDays)
          ) {
            // Convert workingDays to regularDaysOff
            const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
            regularDaysOff = allDays.filter(
              (day) => !storedSettings.workingDays!.includes(day)
            );
            console.log("Working days:", storedSettings.workingDays);
            console.log("Regular days off:", regularDaysOff);
          }
          if (storedSettings.isAvailable !== undefined) {
            isAvailable = storedSettings.isAvailable;
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
      }

      // Check if appointment is during working hours
      const appointmentEndHour = appointmentEndTime.getHours();
      const appointmentEndMinute = appointmentEndTime.getMinutes();

      console.log("Checking working hours compatibility:");
      console.log(
        `Working hours: ${workingHours.start}:00 - ${workingHours.end}:00`
      );
      console.log(
        `Appointment: ${timeHour}:${timeMinute
          .toString()
          .padStart(2, "0")} - ${appointmentEndHour}:${appointmentEndMinute
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
      }

      // Check if appointment end time is within working hours
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

      // Check for conflicts with existing bookings
      console.log("=== CHECKING FOR BOOKING CONFLICTS ===");
      console.log(
        "Using makeup artist ID for conflict check:",
        makeupArtistRecord.id
      );
      console.log(
        "Requested appointment:",
        appointmentDateTime.toLocaleString("en-US", {
          timeZone: "Africa/Cairo",
        })
      );
      console.log(
        "Requested appointment duration:",
        validatedData.duration,
        "minutes"
      );

      // Query for bookings on the requested day using Egypt timezone comparison
      const existingBookings = await db.booking.findMany({
        where: {
          artist_id: makeupArtistRecord.id,
          booking_status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
        select: {
          id: true,
          date_time: true,
          booking_status: true,
          service_type: true,
        },
      });

      // Filter bookings to only those on the same day in Egypt timezone
      const sameDayBookings = existingBookings.filter((booking) =>
        isSameDayInEgypt(booking.date_time, appointmentDateTime)
      );

      console.log(
        `Found ${sameDayBookings.length} existing bookings for the day in Egypt timezone`
      );

      // Log each existing booking for debugging
      sameDayBookings.forEach((booking, index) => {
        console.log(`Existing booking ${index + 1}:`, {
          id: booking.id,
          date_time: booking.date_time.toLocaleString("en-US", {
            timeZone: "Africa/Cairo",
          }),
          utc: booking.date_time.toISOString(),
          status: booking.booking_status,
          service: booking.service_type,
        });
      });

      // Check for overlapping bookings
      console.log("=== CHECKING FOR TIME CONFLICTS ===");

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
      const isOverlapping = sameDayBookings.some((booking) => {
        // Convert existing booking to Egypt timezone for consistent comparison
        const existingStart = toEgyptTime(booking.date_time);
        // Use actual service duration or default to 60 minutes
        const existingDuration =
          serviceNameToDuration.get(booking.service_type) || 60;
        const existingEnd = addMinutes(existingStart, existingDuration);

        console.log(`Checking conflict with booking ${booking.id}:`);
        console.log(
          `  Existing: ${existingStart.toLocaleString("en-US", {
            timeZone: "Africa/Cairo",
          })} to ${existingEnd.toLocaleString("en-US", {
            timeZone: "Africa/Cairo",
          })} (${existingDuration}min)`
        );
        console.log(
          `  New: ${appointmentDateTime.toLocaleString("en-US", {
            timeZone: "Africa/Cairo",
          })} to ${appointmentEndTime.toLocaleString("en-US", {
            timeZone: "Africa/Cairo",
          })} (${validatedData.duration}min)`
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
        console.log("Time slot conflict detected - rejecting booking request");
        return NextResponse.json(
          {
            message:
              "This time slot is already booked. Please select a different time.",
            error: "TIME_CONFLICT",
          },
          { status: 409 } // 409 Conflict status code
        );
      }
      console.log("No conflicts found - proceeding with booking");

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
      console.log("Prepared appointment request:", appointmentRequestData);

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
