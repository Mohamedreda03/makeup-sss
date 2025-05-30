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
    // Get artist ID from params
    const artistId = params.id;

    // Get URL parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days") || "7"; // Default to 7 days
    const serviceId = url.searchParams.get("serviceId"); // Optional service ID for duration-specific availability

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

    // Set date range
    let startDate: Date;
    if (dateParam) {
      startDate = startOfDay(parseISO(dateParam));
    } else {
      startDate = startOfDay(new Date());
    }

    const endDate = addDays(startDate, parseInt(daysParam, 10));

    // Get the makeup artist ID first
    const makeupArtistRecord = await db.makeUpArtist.findFirst({
      where: {
        user_id: artistId,
      },
      select: {
        id: true,
      },
    });

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

    // Fetch all bookings for the artist in the date range
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
    let currentDate = startDate;

    // Define business hours from settings
    const businessHours = {
      start: workingHours.start,
      end: workingHours.end,
      interval: serviceId ? serviceDuration : workingHours.interval, // Use service duration for intervals when specific service is selected
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

            // Check if this slot conflicts with any booking
            let isBooked = false;

            // Debug logging for specific times
            const slotTimeStr = format(slotTime, "HH:mm");
            const shouldLog =
              slotTimeStr === "12:30" || slotTimeStr === "13:00";

            if (shouldLog) {
              console.log(
                `\n=== Checking slot ${slotTimeStr} on ${dayString} ===`
              );
              console.log(
                `Total appointments to check: ${appointments.length}`
              );
            }

            for (const appointment of appointments) {
              const appointmentStart = new Date(appointment.date_time);
              const appointmentEnd = new Date(appointmentStart);
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
                appointmentStart.getHours() * 60 +
                appointmentStart.getMinutes();
              const appointmentEndMinutes =
                appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();
              const slotStartMinutes =
                slotStart.getHours() * 60 + slotStart.getMinutes();
              const slotEndMinutes =
                slotEnd.getHours() * 60 + slotEnd.getMinutes();

              if (shouldLog) {
                console.log(
                  `Appointment: ${format(appointmentStart, "HH:mm")}-${format(
                    appointmentEnd,
                    "HH:mm"
                  )} (${appointmentStartMinutes}-${appointmentEndMinutes} minutes), Status: ${
                    appointment.booking_status
                  }`
                );
                console.log(
                  `Slot: ${format(slotStart, "HH:mm")}-${format(
                    slotEnd,
                    "HH:mm"
                  )} (${slotStartMinutes}-${slotEndMinutes} minutes)`
                );
              }

              // Check if the appointment is on the same day
              const appointmentDate = format(appointmentStart, "yyyy-MM-dd");
              if (appointmentDate !== dayString) {
                if (shouldLog) {
                  console.log(
                    `Different date: ${appointmentDate} vs ${dayString}`
                  );
                }
                continue;
              }

              // Only consider PENDING and CONFIRMED appointments
              if (
                appointment.booking_status !== "PENDING" &&
                appointment.booking_status !== "CONFIRMED"
              ) {
                if (shouldLog) {
                  console.log(
                    `Skipping appointment with status: ${appointment.booking_status}`
                  );
                }
                continue;
              }

              // Check for any overlap between the slot and the appointment
              // Improved overlap logic using minutes
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

              if (hasOverlap) {
                if (shouldLog) {
                  console.log(
                    `CONFLICT FOUND! Slot ${slotTimeStr} overlaps with appointment at ${format(
                      appointmentStart,
                      "HH:mm"
                    )}`
                  );
                }
                isBooked = true;
                break;
              } else if (shouldLog) {
                console.log(
                  `No conflict with appointment at ${format(
                    appointmentStart,
                    "HH:mm"
                  )}`
                );
              }
            }

            if (shouldLog) {
              console.log(
                `Final result for slot ${slotTimeStr}: ${
                  isBooked ? "BOOKED" : "AVAILABLE"
                }`
              );
              console.log(`=== End check for slot ${slotTimeStr} ===\n`);
            }

            // Log slot status for debugging
            if (
              format(slotTime, "HH:mm") === "10:00" ||
              format(slotTime, "HH:mm") === "14:00"
            ) {
              console.log(
                `Slot ${format(
                  slotTime,
                  "HH:mm"
                )} on ${dayString}: isBooked = ${isBooked}`
              );
            }

            // Format the time display (e.g., "10:00 AM")
            const timeLabel = format(slotTime, "h:mm a");

            // Add both available and booked slots to the list
            allTimeSlots.push({
              time: format(slotTime, "HH:mm"),
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
