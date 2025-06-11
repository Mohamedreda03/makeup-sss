import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, startOfDay, getDay } from "date-fns";
import {
  formatTimeSimple,
  createSimpleDateTime,
  formatSimpleDateTime,
} from "@/lib/timezone-config";

const DEFAULT_BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM (17:00)
  interval: 30, // 30 minute intervals
};

// Default regular days off (Sunday = 0, Saturday = 6)
const DEFAULT_REGULAR_DAYS_OFF = [0, 6]; // Sunday and Saturday

// GET /api/artists/[id]/availability
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const artistId = params.id;

    // Get URL parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days") || "7";

    // Validate artist exists
    const artist = await db.user.findUnique({
      where: { id: artistId, role: "ARTIST" },
      select: { id: true, name: true },
    });

    if (!artist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Get makeup artist record
    const makeupArtistRecord = await db.makeUpArtist.findFirst({
      where: { user_id: artistId },
      select: { id: true, available_slots: true },
    });

    if (!makeupArtistRecord) {
      return NextResponse.json({
        artistId,
        artistName: artist.name,
        isAvailable: false,
        message: "Artist profile not found",
        availability: [],
      });
    } // Parse availability settings - use simple local time approach
    let workingHours = DEFAULT_BUSINESS_HOURS;
    let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
    let isAvailable = true;

    if (makeupArtistRecord?.available_slots) {
      try {
        const storedSettings = makeupArtistRecord.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          sessionDuration?: number;
          breakBetweenSessions?: number;
          isAvailable?: boolean;
        };

        console.log("Raw stored settings:", storedSettings); // Simple approach: use times directly as local time
        if (storedSettings.startTime && storedSettings.endTime) {
          workingHours = {
            start:
              parseInt(storedSettings.startTime.split(":")[0]) ||
              DEFAULT_BUSINESS_HOURS.start,
            end:
              parseInt(storedSettings.endTime.split(":")[0]) ||
              DEFAULT_BUSINESS_HOURS.end,
            interval:
              storedSettings.sessionDuration || DEFAULT_BUSINESS_HOURS.interval,
          };
        }

        // Handle working days and availability
        const workingDays = storedSettings.workingDays || [1, 2, 3, 4, 5]; // Monday to Friday default
        if (workingDays && Array.isArray(workingDays)) {
          const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
          regularDaysOff = allDays.filter((day) => !workingDays.includes(day));
        }

        if (storedSettings.isAvailable !== undefined) {
          isAvailable = storedSettings.isAvailable;
        }

        console.log("Processed settings:", {
          workingHours,
          regularDaysOff,
          isAvailable,
        });
      } catch (error) {
        console.error("Error parsing availability settings:", error);
      }
    }

    if (!isAvailable) {
      return NextResponse.json({
        artistId,
        artistName: artist.name,
        isAvailable: false,
        message: "This artist is not currently accepting bookings",
        availability: [],
      });
    } // Set date range using simple local dates
    let startDate: Date;
    if (dateParam) {
      const [year, month, day] = dateParam.split("-").map(Number);
      startDate = startOfDay(new Date(year, month - 1, day));
    } else {
      startDate = startOfDay(new Date());
    }

    const endDate = addDays(startDate, parseInt(daysParam, 10));

    // Fetch ALL appointments for this artist
    const allAppointments = await db.booking.findMany({
      where: {
        artist_id: makeupArtistRecord.id,
        booking_status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: {
        id: true,
        date_time: true,
        service_type: true,
        booking_status: true,
      },
    });

    console.log(`=== ARTIST DEBUG INFO ===`);
    console.log(`Artist User ID: ${artistId}`);
    console.log(`Artist Name: ${artist.name}`);
    console.log(`MakeupArtist Record ID: ${makeupArtistRecord.id}`);
    console.log(
      `Date range: ${format(startDate, "yyyy-MM-dd")} to ${format(
        endDate,
        "yyyy-MM-dd"
      )}`
    );
    console.log(`Total appointments found: ${allAppointments.length}`); // Filter appointments for the date range using stored Egypt time
    const relevantAppointments = allAppointments.filter((apt) => {
      // The stored datetime represents Egypt time as UTC components
      // Parse it correctly to get the Egypt time
      const appointmentDate = new Date(apt.date_time);
      return appointmentDate >= startDate && appointmentDate < endDate;
    });
    console.log(
      `Relevant appointments in date range: ${relevantAppointments.length}`
    );
    if (relevantAppointments.length > 0) {
      console.log("=== RELEVANT APPOINTMENTS ===");
      relevantAppointments.forEach((apt, index) => {
        // The stored datetime represents Egypt time as UTC components
        const aptDate = new Date(apt.date_time);
        console.log(`${index + 1}. ID: ${apt.id}`);
        console.log(`   Date/Time (stored): ${apt.date_time}`);
        console.log(`   Date/Time (Egypt): ${formatSimpleDateTime(aptDate)}`);
        console.log(`   Service: ${apt.service_type}`);
        console.log(`   Status: ${apt.booking_status}`);
      });
    }

    console.log("Working hours configuration:", workingHours);
    console.log("Days off configuration:", regularDaysOff);

    // Get service durations
    const artistServices = await db.artistService.findMany({
      where: { artistId: artistId },
      select: { id: true, name: true, duration: true },
    });

    const serviceNameToDuration = new Map<string, number>();
    artistServices.forEach((service) => {
      serviceNameToDuration.set(service.name, service.duration);
    });

    // Generate availability
    const availabilityByDay = [];
    let currentDate = new Date(startDate);
    const endLocalDate = new Date(endDate);

    while (currentDate < endLocalDate) {
      const dayString = format(currentDate, "yyyy-MM-dd");
      const dayLabel = format(currentDate, "EEE");
      const dayNumber = format(currentDate, "d");
      const monthName = format(currentDate, "MMM");
      const dayOfWeek = getDay(currentDate); // 0 = Sunday, 6 = Saturday

      const isDayOff = regularDaysOff.includes(dayOfWeek);
      const allTimeSlots = [];

      if (!isDayOff) {
        // Generate time slots for this day
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          for (let minute = 0; minute < 60; minute += workingHours.interval) {
            // Create slot time using simple local time
            const slotDateTime = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              hour,
              minute
            );

            // Skip past slots - simple local time comparison
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );

            // Only skip if slot is in the past
            if (
              currentDate.getTime() === today.getTime() &&
              slotDateTime < now
            ) {
              continue;
            } else if (currentDate < today) {
              continue;
            }

            const slotTimeStr = format(slotDateTime, "HH:mm");
            const timeLabel = formatTimeSimple(slotTimeStr); // Check if this slot conflicts with any appointment
            let isBooked = false;
            for (const appointment of relevantAppointments) {
              // The stored datetime represents Egypt time as UTC components
              const appointmentDate = new Date(appointment.date_time);

              // Check if appointment is on the same day using UTC components
              // Since both stored time and slot time represent Egypt time
              const appointmentDay = format(appointmentDate, "yyyy-MM-dd");
              const slotDay = format(currentDate, "yyyy-MM-dd");

              if (appointmentDay !== slotDay) {
                continue;
              }

              // Get appointment time components (these represent Egypt time)
              const appointmentHour = appointmentDate.getUTCHours();
              const appointmentMinute = appointmentDate.getUTCMinutes();

              const appointmentDuration =
                serviceNameToDuration.get(appointment.service_type) || 60;

              // Convert times to minutes for comparison
              const appointmentMinutes =
                appointmentHour * 60 + appointmentMinute;
              const appointmentEndMinutes =
                appointmentMinutes + appointmentDuration;
              const slotMinutes = hour * 60 + minute;
              const slotEndMinutes = slotMinutes + workingHours.interval;

              // Check for overlap
              const hasOverlap = !(
                slotEndMinutes <= appointmentMinutes ||
                slotMinutes >= appointmentEndMinutes
              );

              if (hasOverlap && appointment.booking_status !== "CANCELLED") {
                console.log(
                  `Blocking slot ${slotTimeStr} due to appointment at ${appointmentHour}:${appointmentMinute
                    .toString()
                    .padStart(2, "0")}`
                );
                isBooked = true;
                break;
              }
            }

            allTimeSlots.push({
              time: slotTimeStr,
              label: timeLabel,
              isBooked: isBooked,
            });
          }
        }
      }

      availabilityByDay.push({
        date: dayString,
        dayLabel,
        dayNumber,
        monthName,
        isDayOff,
        timeSlots: allTimeSlots,
      });

      currentDate = addDays(currentDate, 1);
    }

    return NextResponse.json({
      artistId,
      artistName: artist.name,
      isAvailable: true,
      availability: availabilityByDay,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
