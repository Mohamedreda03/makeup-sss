import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getDay, format, addMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";

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

// Appointment request schema for validation
const appointmentRequestSchema = z.object({
  artistId: z.string(),
  serviceId: z.string().optional(),
  serviceType: z.string(),
  datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3}Z)?$/),
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
        console.log(`No makeup artist record found for user ID: ${validatedData.artistId}`);
        return NextResponse.json(
          { message: "Artist profile not found" },
          { status: 404 }
        );
      }

      console.log(`Makeup artist ID found: ${makeupArtistRecord.id}`);

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
        );      } // Check for conflicts with existing bookings
      console.log("=== CHECKING FOR BOOKING CONFLICTS ===");
      console.log("Using makeup artist ID for conflict check:", makeupArtistRecord.id);
      console.log("Requested appointment time:", appointmentDateTime.toISOString());
      console.log("Requested appointment duration:", validatedData.duration, "minutes");
      
      const existingBookings = await db.booking.findMany({
        where: {
          artist_id: makeupArtistRecord.id, // Use makeup artist ID, not user ID
          booking_status: {
            in: ["PENDING", "CONFIRMED"],
          },
          date_time: {
            gte: new Date(new Date(dateString).setHours(0, 0, 0, 0)),
            lt: new Date(new Date(dateString).setHours(24, 0, 0, 0)),
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
      
      // Log each existing booking for debugging
      existingBookings.forEach((booking, index) => {
        console.log(`Existing booking ${index + 1}:`, {
          id: booking.id,
          date_time: booking.date_time.toISOString(),
          status: booking.booking_status,
          service: booking.service_type
        });
      });      // Check for overlapping bookings with improved logic
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

      const isOverlapping = existingBookings.some((booking) => {
        const existingStart = new Date(booking.date_time);
        // Use actual service duration or default to 60 minutes
        const existingDuration = serviceNameToDuration.get(booking.service_type) || 60;
        const existingEnd = addMinutes(existingStart, existingDuration);

        console.log(`Checking conflict with booking ${booking.id}:`);
        console.log(`  Existing: ${existingStart.toISOString()} to ${existingEnd.toISOString()} (${existingDuration}min)`);
        console.log(`  New: ${appointmentDateTime.toISOString()} to ${appointmentEndTime.toISOString()} (${validatedData.duration}min)`);

        // Improved overlap detection
        const hasOverlap = (
          // New appointment starts during an existing appointment
          (appointmentDateTime >= existingStart && appointmentDateTime < existingEnd) ||
          // New appointment ends during an existing appointment
          (appointmentEndTime > existingStart && appointmentEndTime <= existingEnd) ||
          // New appointment completely contains an existing appointment
          (appointmentDateTime <= existingStart && appointmentEndTime >= existingEnd) ||
          // Existing appointment completely contains the new appointment
          (existingStart <= appointmentDateTime && existingEnd >= appointmentEndTime)
        );

        console.log(`  Overlap detected: ${hasOverlap}`);
        
        return hasOverlap;
      });

      if (isOverlapping) {
        console.log("=== TIME SLOT CONFLICT DETECTED ===");
        console.log("Rejecting booking request due to time conflict");
        return NextResponse.json(
          { 
            message: "This time slot is already booked. Please select a different time.",
            error: "TIME_CONFLICT"
          },
          { status: 409 } // 409 Conflict status code
        );
      }

      console.log("=== NO CONFLICTS FOUND - PROCEEDING WITH BOOKING ===");

      // Generate a temporary request ID
      const tempRequestId = uuidv4();

      // Prepare appointment data
      const appointmentRequestData = {
        userId,
        artistId: validatedData.artistId,
        datetime: appointmentDateTime,
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
