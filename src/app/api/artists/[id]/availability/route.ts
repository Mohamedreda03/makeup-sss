import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, parseISO, startOfDay, getDay } from "date-fns";
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
    console.log("=== AVAILABILITY API START ===");
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Database URL exists:", !!process.env.DATABASE_URL);
    console.log("Server local time:", new Date().toLocaleString());

    // Get artist ID from params
    const artistId = params.id;
    console.log("Artist ID:", artistId);

    // Get URL parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days") || "7"; // Default to 7 days
    const serviceId = url.searchParams.get("serviceId"); // Optional service ID for duration-specific availability

    console.log("Request params:", { dateParam, daysParam, serviceId });

    // Validate artist exists
    console.log("Checking if artist exists...");
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: { id: true, name: true },
    });

    console.log("Artist found:", !!artist);
    if (!artist) {
      console.log("Artist not found, returning 404");
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }
    console.log("Artist details:", { id: artist.id, name: artist.name });

    // Fetch service duration if serviceId is provided
    let serviceDuration = 60; // Default duration in minutes
    if (serviceId) {
      const service = await db.artistService.findUnique({
        where: {
          id: serviceId,
          artistId: artistId,
        },
        select: {
          duration: true,
        },
      });

      if (service) {
        serviceDuration = service.duration;
      }
    }

    // Fetch artist's availability settings from makeup_artist table
    const makeupArtist = await db.makeUpArtist.findFirst({
      where: {
        user_id: artistId,
      },
      select: {
        available_slots: true,
      },
    });

    // Parse availability settings or use defaults
    let workingHours = DEFAULT_BUSINESS_HOURS;
    let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
    let isAvailable = true; // Default to available if not specified

    if (makeupArtist?.available_slots) {
      try {
        const settings = makeupArtist.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          sessionDuration?: number;
          breakBetweenSessions?: number;
          isAvailable?: boolean;
        };

        // Convert availability settings to the format expected by this API
        if (settings.startTime && settings.endTime) {
          workingHours = {
            start:
              parseInt(settings.startTime.split(":")[0]) ||
              DEFAULT_BUSINESS_HOURS.start,
            end:
              parseInt(settings.endTime.split(":")[0]) ||
              DEFAULT_BUSINESS_HOURS.end,
            interval:
              settings.sessionDuration || DEFAULT_BUSINESS_HOURS.interval,
          };
        }

        // Convert workingDays to regularDaysOff
        if (settings.workingDays && Array.isArray(settings.workingDays)) {
          const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
          regularDaysOff = allDays.filter(
            (day) => !settings.workingDays!.includes(day)
          );
        }

        // Get the artist's overall availability status
        if (settings.isAvailable !== undefined) {
          isAvailable = settings.isAvailable;
        }

        console.log(
          "Using artist availability settings from available_slots:",
          {
            isAvailable,
            workingHours,
            regularDaysOff: JSON.stringify(regularDaysOff),
            originalSettings: settings,
          }
        );
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

    // Set date range with simple local time handling
    let startDate: Date;
    if (dateParam) {
      // Parse provided date directly without timezone conversion
      startDate = startOfDay(parseISO(dateParam));
    } else {
      // Use current date
      startDate = startOfDay(new Date());
    }

    // End date
    const endDate = addDays(startDate, parseInt(daysParam, 10));

    console.log("=== DATE RANGE DEBUG ===");
    console.log("Start date:", startDate.toISOString());
    console.log("End date:", endDate.toISOString());
    console.log("Local start date:", startDate.toLocaleString());
    console.log("Local end date:", endDate.toLocaleString());

    // Get the makeup artist ID first
    console.log("Looking for makeup artist record...");
    const makeupArtistRecord = await db.makeUpArtist.findFirst({
      where: {
        user_id: artistId,
      },
      select: {
        id: true,
      },
    });

    console.log("Makeup artist record found:", !!makeupArtistRecord);
    if (!makeupArtistRecord) {
      console.log(`No makeup artist record found for user ID: ${artistId}`);
      return NextResponse.json({
        artistId,
        artistName: artist.name,
        isAvailable: false,
        message: "Artist profile not found",
        availability: [],
      });
    }
    console.log("Makeup artist ID:", makeupArtistRecord.id);

    // Fetch all bookings for the artist in the date range
    console.log("Fetching bookings for date range:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      makeupArtistId: makeupArtistRecord.id,
    });

    const appointments = await db.booking.findMany({
      where: {
        artist_id: makeupArtistRecord.id, // Use makeup artist ID, not user ID
        date_time: {
          gte: startDate,
          lt: endDate,
        },
        // Only include confirmed and pending appointments
        booking_status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
        date_time: true,
        service_type: true,
        booking_status: true,
      },
    });

    console.log(`=== DATABASE QUERY RESULTS ===`);
    console.log(`Query artist_id: ${makeupArtistRecord.id}`);
    console.log(
      `Query date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );
    console.log(`Found ${appointments.length} total appointments`);

    // Log each appointment in detail
    appointments.forEach((apt, index) => {
      console.log(`Appointment ${index + 1}:`, {
        id: apt.id,
        date_time: apt.date_time.toISOString(),
        local_date_time: apt.date_time.toLocaleString(),
        local_date: format(apt.date_time, "yyyy-MM-dd"),
        local_time: format(apt.date_time, "HH:mm"),
        service_type: apt.service_type,
        booking_status: apt.booking_status,
        day_of_week: apt.date_time.getDay(),
      });
    });
    console.log(`=== END DATABASE RESULTS ===`);

    // Also check all bookings without date filter for debugging
    const allBookings = await db.booking.findMany({
      where: {
        artist_id: makeupArtistRecord.id,
        booking_status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
        date_time: true,
        service_type: true,
        booking_status: true,
      },
      take: 10, // Limit to 10 for debugging
    });

    console.log(`=== ALL BOOKINGS FOR ARTIST (sample) ===`);
    console.log(
      `Total bookings for artist ${makeupArtistRecord.id}: ${allBookings.length} (showing max 10)`
    );
    allBookings.forEach((booking, index) => {
      console.log(`All Booking ${index + 1}:`, {
        id: booking.id,
        date_time: booking.date_time.toISOString(),
        local_date_time: booking.date_time.toString(),
        service_type: booking.service_type,
        booking_status: booking.booking_status,
      });
    });
    console.log(`=== END ALL BOOKINGS ===`);

    // Fetch all artist services to map service names to durations
    const artistServices = await db.artistService.findMany({
      where: {
        artistId: artistId,
      },
      select: {
        id: true,
        name: true,
        duration: true,
      },
    });

    // Create a mapping of service names to durations
    const serviceNameToDuration = new Map<string, number>();
    artistServices.forEach((service) => {
      serviceNameToDuration.set(service.name, service.duration);
    });

    console.log(
      `Found ${appointments.length} appointments for makeup artist ID: ${makeupArtistRecord.id}`
    );
    console.log(
      "Appointments:",
      appointments.map((apt) => ({
        id: apt.id,
        date_time: apt.date_time,
        status: apt.booking_status,
      }))
    );

    console.log(
      `Artist ID: ${artistId}, Makeup Artist ID: ${makeupArtistRecord.id}`
    );
    console.log(
      `Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    // Generate available time slots for each day
    const availabilityByDay = [];

    // Start with local date
    let currentDate = new Date(startDate);
    const endLocalDate = new Date(endDate);

    // Define business hours from settings
    const businessHours = {
      start: workingHours.start,
      end: workingHours.end,
      interval: serviceId ? serviceDuration : workingHours.interval, // Use service duration for intervals when specific service is selected
    };

    console.log("=== TIME SLOT GENERATION (SIMPLIFIED) ===");
    console.log("Business hours:", businessHours);
    console.log("Date range:", {
      start: currentDate.toLocaleString(),
      end: endLocalDate.toLocaleString(),
    });

    // Loop through each day in the range
    while (currentDate < endLocalDate) {
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

            // Skip slots in the past (compare in local time)
            const now = new Date();
            if (slotTime < now) {
              continue;
            }

            // Check if this slot conflicts with any booking
            let isBooked = false;
            const slotTimeStr = format(slotTime, "HH:mm");
            const slotDateStr = format(currentDate, "yyyy-MM-dd");

            // Enhanced debugging - log every slot check
            console.log(
              `\n--- Checking slot ${slotTimeStr} on ${slotDateStr} ---`
            );
            console.log(`Slot datetime: ${slotTime.toLocaleString()}`);
            console.log(
              `Current appointments to check: ${appointments.length}`
            );

            for (const appointment of appointments) {
              // Use appointment time directly (already in local time due to simplified storage)
              const appointmentDateTime = new Date(appointment.date_time);
              const appointmentEnd = new Date(appointmentDateTime);

              // Use the actual service duration instead of hardcoded 60 minutes
              const appointmentDuration =
                serviceNameToDuration.get(appointment.service_type) ||
                serviceDuration ||
                60;
              appointmentEnd.setMinutes(
                appointmentEnd.getMinutes() + appointmentDuration
              );

              // Create date objects for the current slot
              const slotStart = new Date(slotTime);
              const slotEnd = new Date(slotTime);
              slotEnd.setMinutes(slotEnd.getMinutes() + businessHours.interval);

              // Convert times to minutes for easier comparison
              const appointmentStartMinutes =
                appointmentDateTime.getHours() * 60 +
                appointmentDateTime.getMinutes();
              const appointmentEndMinutes =
                appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();
              const slotStartMinutes =
                slotStart.getHours() * 60 + slotStart.getMinutes();
              const slotEndMinutes =
                slotEnd.getHours() * 60 + slotEnd.getMinutes();

              // Check if the appointment is on the same day
              const appointmentDate = format(appointmentDateTime, "yyyy-MM-dd");

              console.log(`  Checking appointment ${appointment.id}:`);
              console.log(
                `    DateTime: ${appointment.date_time.toISOString()}`
              );
              console.log(`    Local: ${appointmentDateTime.toLocaleString()}`);
              console.log(
                `    Date: ${appointmentDate} (slot: ${slotDateStr})`
              );
              console.log(
                `    Time: ${format(appointmentDateTime, "HH:mm")}-${format(
                  appointmentEnd,
                  "HH:mm"
                )}`
              );
              console.log(`    Status: ${appointment.booking_status}`);
              console.log(
                `    Service: ${appointment.service_type} (${appointmentDuration}min)`
              );

              if (appointmentDate !== slotDateStr) {
                console.log(`    → SKIP: Different date`);
                continue;
              }

              // Only consider PENDING and CONFIRMED appointments
              if (
                appointment.booking_status !== "PENDING" &&
                appointment.booking_status !== "CONFIRMED"
              ) {
                console.log(`    → SKIP: Status not pending/confirmed`);
                continue;
              }

              // Check for any overlap between the slot and the appointment
              // Improved overlap logic using minutes (all in local time)
              const hasOverlap =
                // Slot starts during an appointment
                (slotStartMinutes >= appointmentStartMinutes &&
                  slotStartMinutes < appointmentEndMinutes) ||
                // Slot ends during an appointment
                (slotEndMinutes > appointmentStartMinutes &&
                  slotEndMinutes <= appointmentEndMinutes) ||
                // Slot completely contains an appointment
                (slotStartMinutes <= appointmentStartMinutes &&
                  slotEndMinutes >= appointmentEndMinutes) ||
                // Appointment completely contains the slot
                (appointmentStartMinutes <= slotStartMinutes &&
                  appointmentEndMinutes >= slotEndMinutes);

              console.log(`    Overlap check:`);
              console.log(
                `      Slot: ${slotStartMinutes}-${slotEndMinutes} minutes`
              );
              console.log(
                `      Appointment: ${appointmentStartMinutes}-${appointmentEndMinutes} minutes`
              );
              console.log(`      Has overlap: ${hasOverlap}`);

              if (hasOverlap) {
                console.log(`    → CONFLICT! Slot marked as booked`);
                isBooked = true;
                break;
              } else {
                console.log(`    → No conflict`);
              }
            }

            console.log(
              `Final result for ${slotTimeStr}: ${
                isBooked ? "BOOKED" : "AVAILABLE"
              }`
            );
            console.log(`--- End slot check ---\n`);

            // Format the time display (e.g., "10:00 AM")
            const timeLabel = format(slotTime, "h:mm a");

            // Add both available and booked slots to the list
            allTimeSlots.push({
              time: slotTimeStr,
              label: timeLabel,
              isBooked: isBooked,
            });
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

    console.log(`=== FINAL AVAILABILITY SUMMARY ===`);
    console.log(`Total days processed: ${availabilityByDay.length}`);
    availabilityByDay.forEach((day, index) => {
      const bookedSlots = day.timeSlots.filter((slot) => slot.isBooked);
      const availableSlots = day.timeSlots.filter((slot) => !slot.isBooked);
      console.log(`Day ${index + 1} (${day.date}):`, {
        dayLabel: day.dayLabel,
        isDayOff: day.isDayOff,
        totalSlots: day.timeSlots.length,
        bookedSlots: bookedSlots.length,
        availableSlots: availableSlots.length,
        bookedTimes: bookedSlots.map((s) => s.time).join(", ") || "none",
      });
    });
    console.log(`=== END AVAILABILITY SUMMARY ===`);
    console.log("=== AVAILABILITY API END ===");

    return NextResponse.json({
      artistId,
      artistName: artist.name,
      isAvailable: true,
      availability: availabilityByDay,
    });
  } catch (error) {
    console.error("=== AVAILABILITY API ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", (error as Error)?.stack);
    console.error("Environment:", process.env.NODE_ENV);
    console.error("Database URL exists:", !!process.env.DATABASE_URL);
    console.error("=== END ERROR LOG ===");
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
