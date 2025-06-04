import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, startOfDay, getDay } from "date-fns";
import { 
  convertAvailabilityFromUTC, 
  nowInEgypt, 
  createEgyptDate, 
  toEgyptTime,
  isSameDayInEgypt
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
    }    // Parse availability settings and convert from UTC storage to Egypt timezone
    let workingHours = DEFAULT_BUSINESS_HOURS;
    let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
    let isAvailable = true;

    if (makeupArtistRecord?.available_slots) {
      try {        const storedSettings = makeupArtistRecord.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          sessionDuration?: number;
          breakBetweenSessions?: number;
          isAvailable?: boolean;
        };

        // Set default values for required properties
        const settingsWithDefaults = {
          workingDays: storedSettings.workingDays || [1, 2, 3, 4, 5], // Monday to Friday default
          sessionDuration: storedSettings.sessionDuration || 60,
          breakBetweenSessions: storedSettings.breakBetweenSessions || 15,
          isAvailable: storedSettings.isAvailable !== undefined ? storedSettings.isAvailable : true,
          startTime: storedSettings.startTime,
          endTime: storedSettings.endTime,
        };

        // Convert from UTC storage to Egypt timezone for display/processing
        const settings = convertAvailabilityFromUTC(settingsWithDefaults);

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

        if (settings.workingDays && Array.isArray(settings.workingDays)) {
          const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
          regularDaysOff = allDays.filter(
            (day) => !settings.workingDays!.includes(day)
          );
        }

        if (settings.isAvailable !== undefined) {
          isAvailable = settings.isAvailable;
        }
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
    }    // Set date range in Egypt timezone
    let startDate: Date;
    if (dateParam) {
      const [year, month, day] = dateParam.split("-").map(Number);
      startDate = startOfDay(createEgyptDate(year, month, day));
    } else {
      startDate = startOfDay(nowInEgypt());
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
    console.log(`Total appointments found: ${allAppointments.length}`);    // Filter appointments for the date range using Egypt timezone
    const relevantAppointments = allAppointments.filter((apt) => {
      const aptInEgypt = toEgyptTime(apt.date_time);
      return aptInEgypt >= startDate && aptInEgypt < endDate;
    });

    console.log(
      `Relevant appointments in date range: ${relevantAppointments.length}`
    );

    if (relevantAppointments.length > 0) {
      console.log("=== RELEVANT APPOINTMENTS ===");
      relevantAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. ID: ${apt.id}`);
        console.log(
          `   Date/Time: ${apt.date_time} (${format(
            apt.date_time,
            "yyyy-MM-dd HH:mm"
          )})`
        );
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
            // Create slot time in Egypt timezone
            const slotDateTime = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              hour,
              minute
            );            // Skip past slots - compare using Egypt time
            const nowEgyptTime = nowInEgypt();
            const todayInEgypt = new Date(
              nowEgyptTime.getFullYear(),
              nowEgyptTime.getMonth(),
              nowEgyptTime.getDate()
            );            // Only skip if slot is in the past (same day or earlier + past time)
            if (
              currentDate.getTime() === todayInEgypt.getTime() &&
              slotDateTime < nowEgyptTime
            ) {
              continue;
            } else if (currentDate < todayInEgypt) {
              continue;
            }

            const slotTimeStr = format(slotDateTime, "HH:mm");
            const timeLabel = format(slotDateTime, "h:mm a");            // Check if this slot conflicts with any appointment
            let isBooked = false;
            for (const appointment of relevantAppointments) {
              const appointmentInEgypt = toEgyptTime(appointment.date_time);

              // Check if appointment is on the same day
              if (!isSameDayInEgypt(appointmentInEgypt, currentDate)) {
                continue;
              }

              const appointmentDuration =
                serviceNameToDuration.get(appointment.service_type) || 60;

              // Calculate appointment end time
              const appointmentEnd = new Date(appointmentInEgypt);
              appointmentEnd.setMinutes(
                appointmentEnd.getMinutes() + appointmentDuration
              );

              // Convert times to minutes for comparison
              const slotMinutes = hour * 60 + minute;
              const slotEndMinutes = slotMinutes + workingHours.interval;
              const appointmentMinutes =
                appointmentInEgypt.getHours() * 60 + appointmentInEgypt.getMinutes();
              const appointmentEndMinutes =
                appointmentEnd.getHours() * 60 + appointmentEnd.getMinutes();

              // Check for overlap
              const hasOverlap = !(
                slotEndMinutes <= appointmentMinutes ||
                slotMinutes >= appointmentEndMinutes
              );

              if (hasOverlap) {
                isBooked = true;
                break;
              }            }

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
