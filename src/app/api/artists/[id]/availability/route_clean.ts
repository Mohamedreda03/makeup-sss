import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, startOfDay, getDay } from "date-fns";
import {
  createEgyptDate,
  nowInEgypt,
  toEgyptTime,
  isSameDayInEgypt,
} from "@/lib/timezone-config";

const DEFAULT_BUSINESS_HOURS = {
  start: 10, // 10 AM
  end: 22, // 10 PM (22:00)
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
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const daysParam = url.searchParams.get("days") || "7";

    console.log("=== AVAILABILITY API START ===");
    console.log("Artist ID:", artistId);
    console.log("Date param:", dateParam);
    console.log("Days param:", daysParam);

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
    }

    // Parse availability settings or use defaults
    let workingHours = DEFAULT_BUSINESS_HOURS;
    let regularDaysOff = DEFAULT_REGULAR_DAYS_OFF;
    let isAvailable = true;

    if (makeupArtistRecord?.available_slots) {
      try {
        const settings = makeupArtistRecord.available_slots as {
          workingDays?: number[];
          startTime?: string;
          endTime?: string;
          sessionDuration?: number;
          isAvailable?: boolean;
        };

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
          const allDays = [0, 1, 2, 3, 4, 5, 6];
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

    console.log("Final working hours:", workingHours);
    console.log("Regular days off:", regularDaysOff);
    console.log("Artist available:", isAvailable);

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
      const [year, month, day] = dateParam.split("-").map(Number);
      startDate = startOfDay(createEgyptDate(year, month, day));
    } else {
      startDate = startOfDay(nowInEgypt());
    }

    const endDate = addDays(startDate, parseInt(daysParam, 10));

    console.log("Date range:", {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

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

    // Filter appointments for the date range in Egypt timezone
    const relevantAppointments = allAppointments.filter((apt) => {
      const aptInEgypt = toEgyptTime(apt.date_time);
      return aptInEgypt >= startDate && aptInEgypt < endDate;
    });

    console.log(`Total appointments: ${allAppointments.length}`);
    console.log(`Relevant appointments: ${relevantAppointments.length}`);

    // Get service durations
    const artistServices = await db.artistService.findMany({
      where: { artistId: artistId },
      select: { name: true, duration: true },
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
      const dayOfWeek = getDay(currentDate);

      const isDayOff = regularDaysOff.includes(dayOfWeek);
      const allTimeSlots = [];

      console.log(
        `Processing day: ${dayString}, Day of week: ${dayOfWeek}, Is day off: ${isDayOff}`
      );

      if (!isDayOff) {
        // Generate time slots for this day
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          for (let minute = 0; minute < 60; minute += workingHours.interval) {
            // Create slot time in Egypt timezone
            const slotDateTime = createEgyptDate(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              currentDate.getDate(),
              hour,
              minute
            );

            // Skip past slots
            const nowEgypt = nowInEgypt();
            if (slotDateTime < nowEgypt) {
              continue;
            }

            const slotTimeStr = format(slotDateTime, "HH:mm");
            const timeLabel = format(slotDateTime, "h:mm a");

            // Check if this slot conflicts with any appointment
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
                appointmentInEgypt.getHours() * 60 +
                appointmentInEgypt.getMinutes();
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

      console.log(
        `Day ${dayString}: Generated ${allTimeSlots.length} time slots`
      );

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

    console.log("=== AVAILABILITY API END ===");

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
