import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, startOfDay, getDay } from "date-fns";

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
    }

    // Parse availability settings
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
    }

    // Set date range in Egypt timezone
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
    console.log(`Total appointments found: ${allAppointments.length}`);

    // Filter appointments for the date range - removed timezone conversion
    const relevantAppointments = allAppointments.filter((apt) => {
      return apt.date_time >= startDate && apt.date_time < endDate;
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
            );

            // Skip past slots - compare using Egypt time
            const nowInEgypt = new Date();
            const todayInEgypt = new Date(
              nowInEgypt.getFullYear(),
              nowInEgypt.getMonth(),
              nowInEgypt.getDate()
            );

            // Only skip if slot is in the past (same day or earlier + past time)
            if (
              currentDate.getTime() === todayInEgypt.getTime() &&
              slotDateTime < nowInEgypt
            ) {
              continue;
            } else if (currentDate < todayInEgypt) {
              continue;
            }

            const slotTimeStr = format(slotDateTime, "HH:mm");
            const timeLabel = format(slotDateTime, "h:mm a"); // Check if this slot conflicts with any appointment
            let isBooked = false;
            for (const appointment of relevantAppointments) {
              const appointmentDate = appointment.date_time;

              // Convert UTC time to Egypt timezone properly
              const egyptTimeString = appointmentDate.toLocaleString("en-US", {
                timeZone: "Africa/Cairo",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              // Parse the Egypt time string to get date and time components
              const [datePart, timePart] = egyptTimeString.split(", ");
              const [month, day, year] = datePart.split("/");
              const [appointmentHour, appointmentMinute] = timePart
                .split(":")
                .map(Number);

              // Create a date object for comparison (date only)
              const appointmentEgyptDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );

              // Simple date comparison using date strings
              const appointmentDay = format(appointmentEgyptDate, "yyyy-MM-dd");
              const slotDay = format(currentDate, "yyyy-MM-dd"); // Skip if not the same day
              if (appointmentDay !== slotDay) {
                continue;
              }
              console.log(`\n=== APPOINTMENT ANALYSIS ===`);
              console.log(
                `Original appointment time (UTC): ${appointmentDate}`
              );
              console.log(`Egypt time string: ${egyptTimeString}`);
              console.log(
                `Appointment day: ${appointmentDay}, Slot day: ${slotDay}`
              );
              console.log(
                `Appointment time in Egypt: ${appointmentHour}:${appointmentMinute
                  .toString()
                  .padStart(2, "0")}`
              );
              console.log(`Service: ${appointment.service_type}`);
              console.log(`Appointment ID: ${appointment.id}`);

              // Get appointment time in minutes since midnight (Egypt time)
              const appointmentStartMinutes =
                appointmentHour * 60 + appointmentMinute;

              // Get service duration
              const appointmentDuration =
                serviceNameToDuration.get(appointment.service_type) || 60;
              const appointmentEndMinutes =
                appointmentStartMinutes + appointmentDuration;

              // Get slot time in minutes since midnight
              const slotStartMinutes = hour * 60 + minute;
              const slotEndMinutes = slotStartMinutes + workingHours.interval;

              // Check for time overlap
              const hasOverlap = !(
                slotEndMinutes <= appointmentStartMinutes ||
                slotStartMinutes >= appointmentEndMinutes
              ); // Debug logging for this specific day
              if (appointmentDay === slotDay) {
                console.log(
                  `🔍 Checking slot ${hour}:${minute
                    .toString()
                    .padStart(
                      2,
                      "0"
                    )} vs appointment ${appointmentHour}:${appointmentMinute
                    .toString()
                    .padStart(2, "0")}`
                );
                console.log(
                  `   Slot: ${slotStartMinutes}-${slotEndMinutes} mins | Appointment: ${appointmentStartMinutes}-${appointmentEndMinutes} mins | Overlap: ${hasOverlap}`
                );
              }

              // Enhanced debug logging
              if (hasOverlap) {
                console.log("=== BOOKING CONFLICT FOUND ===", {
                  appointmentId: appointment.id,
                  appointmentDate: appointmentDay,
                  appointmentTimeUTC: format(
                    appointmentDate,
                    "yyyy-MM-dd HH:mm"
                  ),
                  appointmentTimeEgypt: `${appointmentHour}:${appointmentMinute
                    .toString()
                    .padStart(2, "0")}`,
                  appointmentDuration: appointmentDuration,
                  slotTime: `${hour}:${minute.toString().padStart(2, "0")}`,
                  slotDuration: workingHours.interval,
                  appointmentStartMinutes,
                  appointmentEndMinutes,
                  slotStartMinutes,
                  slotEndMinutes,
                  overlap: true,
                });
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
