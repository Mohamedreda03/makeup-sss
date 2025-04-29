import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  isWithinInterval,
  getDay,
} from "date-fns";

// Default working hours if none are set
const DEFAULT_BUSINESS_HOURS = {
  start: 10, // 10 AM
  end: 24, // 12 AM (midnight)
  interval: 30, // 30 minute intervals
};

// Default regular days off
const DEFAULT_REGULAR_DAYS_OFF = [0, 6]; // Sunday and Saturday

// GET /api/artists/[id]/availability
// This endpoint returns the available and booked time slots for an artist on specific dates
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get artist ID from params
    const artistId = params.id;

    // Get URL parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days") || "7"; // Default to 7 days

    // Validate artist exists
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: { id: true, name: true },
    });

    if (!artist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Fetch artist's availability settings from metadata
    const artistMetadata = await db.userMetadata.findUnique({
      where: {
        userId: artistId,
      },
    });

    // Parse availability settings or use defaults
    let workingHours = DEFAULT_BUSINESS_HOURS;
    let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
    let isAvailable = true; // Default to available if not specified

    if (artistMetadata?.availabilitySettings) {
      try {
        const settings = JSON.parse(artistMetadata.availabilitySettings);
        workingHours = settings.workingHours || DEFAULT_BUSINESS_HOURS;
        regularDaysOff = settings.regularDaysOff || DEFAULT_REGULAR_DAYS_OFF;

        // Get the artist's overall availability status
        if (settings.isAvailable !== undefined) {
          isAvailable = settings.isAvailable;
        }

        console.log("Using artist availability settings:", {
          isAvailable,
          workingHours,
          regularDaysOff: JSON.stringify(regularDaysOff),
        });
      } catch (error) {
        console.error("Error parsing availability settings:", error);
      }
    }

    // If artist is not available, return early with the status
    if (!isAvailable) {
      return NextResponse.json({
        artistId,
        artistName: artist.name,
        isAvailable: false,
        message: "This artist is not currently accepting bookings",
        availability: [],
      });
    }

    // Set date range
    let startDate: Date;
    if (dateParam) {
      startDate = startOfDay(parseISO(dateParam));
    } else {
      startDate = startOfDay(new Date());
    }

    const endDate = addDays(startDate, parseInt(daysParam, 10));

    // Fetch all appointments for the artist in the date range
    const appointments = await db.appointment.findMany({
      where: {
        artistId,
        datetime: {
          gte: startDate,
          lt: endDate,
        },
        // Only include confirmed and pending appointments
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
        datetime: true,
        duration: true,
        status: true,
      },
    });

    // Generate available time slots for each day
    const availabilityByDay = [];
    let currentDate = startDate;

    // Define business hours from settings
    const businessHours = {
      start: workingHours.start,
      end: workingHours.end,
      interval: workingHours.interval,
    };

    // Loop through each day in the range
    while (currentDate < endDate) {
      const dayString = format(currentDate, "yyyy-MM-dd");
      const dayLabel = format(currentDate, "EEE");
      const dayNumber = format(currentDate, "d");
      const monthName = format(currentDate, "MMM");
      const dayOfWeek = getDay(currentDate); // 0 = Sunday, 6 = Saturday

      // Log for debugging
      console.log(
        `Checking day: ${dayString}, Day of week: ${dayOfWeek}, Regular days off: ${JSON.stringify(
          regularDaysOff
        )}`
      );
      console.log(
        `Is day off (${dayOfWeek} in [${regularDaysOff.join(
          ", "
        )}]): ${regularDaysOff.includes(dayOfWeek)}`
      );

      // Check if this day is a regular day off
      const isDayOff = regularDaysOff.includes(dayOfWeek);

      console.log(
        `Day ${dayString} (${dayLabel}): Regular day off: ${isDayOff}, Day of week: ${dayOfWeek}`
      );
      console.log(`Regular days off array: ${JSON.stringify(regularDaysOff)}`);

      // Generate all possible time slots for this day
      const allTimeSlots = [];

      // If it's not a day off, generate time slots
      if (!isDayOff) {
        // Use the artist's actual working hours from settings
        for (let hour = businessHours.start; hour < businessHours.end; hour++) {
          // Use the artist's interval setting for appointments
          for (let minute = 0; minute < 60; minute += businessHours.interval) {
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, minute, 0, 0);

            // Skip slots in the past
            if (slotTime < new Date()) {
              continue;
            }

            // Check if this slot conflicts with any appointment
            let isBooked = false;

            for (const appointment of appointments) {
              const appointmentStart = new Date(appointment.datetime);
              const appointmentEnd = new Date(appointmentStart);
              appointmentEnd.setMinutes(
                appointmentEnd.getMinutes() + appointment.duration
              );

              // Create date objects for the current slot
              const slotStart = new Date(slotTime);
              const slotEnd = new Date(slotTime);
              slotEnd.setMinutes(slotEnd.getMinutes() + businessHours.interval);

              // Check for any overlap between the slot and the appointment
              // A slot is booked if:
              // 1. The slot starts during an appointment, OR
              // 2. The slot ends during an appointment, OR
              // 3. The slot completely contains an appointment
              if (
                // Slot starts during an appointment
                (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
                // Slot ends during an appointment
                (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
                // Slot completely contains an appointment
                (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
              ) {
                isBooked = true;
                break;
              }
            }

            // Format the time display (e.g., "10:00 AM")
            const timeLabel = format(slotTime, "h:mm a");

            // Add slot to the list (only include slots that aren't booked)
            if (!isBooked) {
              allTimeSlots.push({
                time: format(slotTime, "HH:mm"),
                label: timeLabel,
                isBooked,
              });
            }
          }
        }
      }

      // Always add this day to the result, even if it's a day off or has no slots
      availabilityByDay.push({
        date: dayString,
        dayLabel,
        dayNumber,
        monthName,
        isDayOff, // Add this flag for the frontend to use
        timeSlots: allTimeSlots,
      });

      // Move to next day
      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      artistId,
      artistName: artist.name,
      isAvailable: true,
      availability: availabilityByDay,
    });
  } catch (error) {
    console.error("Error fetching artist availability:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
