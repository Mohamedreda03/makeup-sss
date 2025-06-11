// Add dayjs utilities for consistent datetime handling
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { format } from "date-fns";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Timezone configuration for consistent handling across dev and production
export const TIMEZONE_CONFIG = {
  // Set your target timezone (Egypt/Cairo)
  timezone: "Africa/Cairo",

  // UTC offset for Egypt (UTC+2, or UTC+3 during DST)
  // This should be configured based on your target market
  defaultOffset: "+02:00",
};

// Utility functions for timezone handling
export const convertToLocalTimezone = (
  date: Date,
  timezone: string = TIMEZONE_CONFIG.timezone
): Date => {
  // Convert a UTC date to local timezone
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Date(utcDate.toLocaleString("en-US", { timeZone: timezone }));
};

export const convertFromLocalTimezone = (
  date: Date,
  timezone: string = TIMEZONE_CONFIG.timezone
): Date => {
  // Convert a local timezone date to UTC
  const localDate = new Date(
    date.toLocaleString("en-US", { timeZone: timezone })
  );
  const offset = localDate.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000);
};

// Create a date in the target timezone
export const createLocalDate = (
  year: number,
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0
): Date => {
  // Create date using the standard Date constructor
  // This avoids timezone offset issues with working hours validation
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  // Debug logging to track datetime creation
  console.log("createLocalDate debug:", {
    input: { year, month, day, hours, minutes },
    created: date.toISOString(),
    localHour: date.getHours(),
    cairoTime: date.toLocaleString("en-US", { timeZone: "Africa/Cairo" }),
    timestamp: date.getTime(),
    timezone: TIMEZONE_CONFIG.timezone,
  });

  return date;
};

// Format date for consistent display
export const formatLocalDate = (
  date: Date,
  format: string = "yyyy-MM-dd"
): string => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_CONFIG.timezone,
    year: format.includes("yyyy") ? "numeric" : undefined,
    month: format.includes("MM") ? "2-digit" : undefined,
    day: format.includes("dd") ? "2-digit" : undefined,
    hour: format.includes("HH") ? "2-digit" : undefined,
    minute: format.includes("mm") ? "2-digit" : undefined,
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type === "year") acc = acc.replace("yyyy", part.value);
      if (part.type === "month") acc = acc.replace("MM", part.value);
      if (part.type === "day") acc = acc.replace("dd", part.value);
      if (part.type === "hour") acc = acc.replace("HH", part.value);
      if (part.type === "minute") acc = acc.replace("mm", part.value);
      return acc;
    }, format);
};

// Get current date/time in target timezone
export const getCurrentLocalDate = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.timezone })
  );
};

// Check if a time slot is in the past (using target timezone)
export const isTimeSlotInPast = (slotDate: Date): boolean => {
  const now = getCurrentLocalDate();
  return slotDate < now;
};

// Validate if a time slot is within working hours
export const validateWorkingHours = (
  date: Date,
  startHour: number = 9,
  endHour: number = 18
): boolean => {
  const hour = date.getHours();
  const isValid = hour >= startHour && hour < endHour;

  console.log("validateWorkingHours:", {
    date: date.toISOString(),
    localTime: date.toLocaleString(),
    hour,
    startHour,
    endHour,
    isValid,
  });

  return isValid;
};

// Create a date in Egypt timezone from date components
export const createEgyptDate = (
  year: number,
  month: number, // 1-12
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date => {
  // Use dayjs to create a date in Egypt timezone and convert to local Date
  const egyptMoment = dayjs.tz(
    `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:${second.toString().padStart(2, "0")}`,
    "Africa/Cairo"
  );

  // Return as a regular Date object representing the Egypt time
  return new Date(
    egyptMoment.year(),
    egyptMoment.month(), // dayjs months are 0-based like Date
    egyptMoment.date(),
    egyptMoment.hour(),
    egyptMoment.minute(),
    egyptMoment.second()
  );
};

// Convert any date to Egypt timezone representation
export const toEgyptTime = (date: Date): Date => {
  // Use dayjs for more reliable timezone conversion
  const egyptMoment = dayjs(date).tz("Africa/Cairo");

  // Create a new Date object with the Egypt timezone components
  return new Date(
    egyptMoment.year(),
    egyptMoment.month(), // dayjs months are 0-based like Date
    egyptMoment.date(),
    egyptMoment.hour(),
    egyptMoment.minute(),
    egyptMoment.second()
  );
};

// Get current time in Egypt timezone
export const nowInEgypt = (): Date => {
  return toEgyptTime(new Date());
};

// Format date in Egypt timezone for display
export const formatInEgypt = (date: Date): string => {
  return date.toLocaleString("en-CA", {
    timeZone: TIMEZONE_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Check if two dates are the same day in Egypt timezone
export const isSameDayInEgypt = (date1: Date, date2: Date): boolean => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-CA", {
      timeZone: TIMEZONE_CONFIG.timezone,
    });
  };

  return formatDate(date1) === formatDate(date2);
};

// Simple helper to display time in Egypt timezone
export const displayTimeInEgypt = (date: Date): string => {
  return date.toLocaleString("en-US", {
    timeZone: TIMEZONE_CONFIG.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Get date components in Egypt timezone
export const getEgyptDateComponents = (date: Date) => {
  const egyptTime = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.timezone })
  );
  return {
    year: egyptTime.getFullYear(),
    month: egyptTime.getMonth() + 1, // 1-based month
    day: egyptTime.getDate(),
    hour: egyptTime.getHours(),
    minute: egyptTime.getMinutes(),
    second: egyptTime.getSeconds(),
  };
};

// Format a time string (HH:MM) to 12-hour format with AM/PM in Egypt timezone
export const formatTimeToEgypt12h = (time: string): string => {
  if (!time || !time.match(/^\d{2}:\d{2}$/)) {
    return time;
  }

  const today = dayjs().format("YYYY-MM-DD");
  const dateTimeString = `${today}T${time}`;
  return dayjs(dateTimeString).tz("Africa/Cairo").format("h:mm A");
};

// Format a date string (YYYY-MM-DD) to localized format in Egypt timezone
export const formatDateToEgyptLocale = (date: string): string => {
  return dayjs(date).tz("Africa/Cairo").format("MMMM D, YYYY");
};

// Convert a date and time from Egypt timezone to UTC ISO string for database storage
export const toEgyptISOString = (date: string, time: string): string => {
  const dateTimeString = `${date}T${time}`;
  // Parse as Egypt time, then convert to UTC
  return dayjs.tz(dateTimeString, "Africa/Cairo").utc().toISOString();
};

// ===== WORKING HOURS UTC CONVERSION FUNCTIONS =====

// Convert working hours from Egypt timezone to UTC for database storage
export const convertWorkingHoursToUTC = (
  startTime: string, // HH:MM format
  endTime: string // HH:MM format
): { startTimeUTC: string; endTimeUTC: string } => {
  // Use a reference date to convert times
  const referenceDate = "2000-01-01";

  const startTimeUTC = dayjs
    .tz(`${referenceDate}T${startTime}`, "Africa/Cairo")
    .utc()
    .format("HH:mm");
  const endTimeUTC = dayjs
    .tz(`${referenceDate}T${endTime}`, "Africa/Cairo")
    .utc()
    .format("HH:mm");

  return {
    startTimeUTC,
    endTimeUTC,
  };
};

// Convert working hours from UTC back to Egypt timezone for display
export const convertWorkingHoursFromUTC = (
  startTimeUTC: string, // HH:MM format in UTC
  endTimeUTC: string // HH:MM format in UTC
): { startTime: string; endTime: string } => {
  // Use a reference date to convert times
  const referenceDate = "2000-01-01";

  const startEgypt = dayjs
    .utc(`${referenceDate}T${startTimeUTC}`)
    .tz("Africa/Cairo")
    .format("HH:mm");
  const endEgypt = dayjs
    .utc(`${referenceDate}T${endTimeUTC}`)
    .tz("Africa/Cairo")
    .format("HH:mm");

  return {
    startTime: startEgypt,
    endTime: endEgypt,
  };
};

// Convert availability settings to UTC for storage
export const convertAvailabilityToUTC = (settings: {
  workingDays: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetweenSessions: number;
  isAvailable: boolean;
}) => {
  const { startTimeUTC, endTimeUTC } = convertWorkingHoursToUTC(
    settings.startTime,
    settings.endTime
  );

  return {
    ...settings,
    startTimeUTC,
    endTimeUTC,
    // Keep original Egypt times for reference
    startTimeEgypt: settings.startTime,
    endTimeEgypt: settings.endTime,
  };
};

// Convert availability settings from UTC for display
export const convertAvailabilityFromUTC = (settings: {
  workingDays: number[];
  startTimeUTC?: string;
  endTimeUTC?: string;
  startTime?: string;
  endTime?: string;
  sessionDuration: number;
  breakBetweenSessions: number;
  isAvailable: boolean;
}) => {
  // If we have UTC times, convert them to Egypt timezone
  if (settings.startTimeUTC && settings.endTimeUTC) {
    const { startTime, endTime } = convertWorkingHoursFromUTC(
      settings.startTimeUTC,
      settings.endTimeUTC
    );

    return {
      workingDays: settings.workingDays,
      startTime,
      endTime,
      sessionDuration: settings.sessionDuration,
      breakBetweenSessions: settings.breakBetweenSessions,
      isAvailable: settings.isAvailable,
    };
  }

  // Fallback to existing Egypt times if UTC not available
  return {
    workingDays: settings.workingDays,
    startTime: settings.startTime || "09:00",
    endTime: settings.endTime || "17:00",
    sessionDuration: settings.sessionDuration,
    breakBetweenSessions: settings.breakBetweenSessions,
    isAvailable: settings.isAvailable,
  };
};

// Check if a given Egypt time falls within working hours (in Egypt timezone)
export const isWithinWorkingHours = (
  egyptTime: Date,
  startTime: string, // HH:MM format in Egypt timezone
  endTime: string // HH:MM format in Egypt timezone
): boolean => {
  const timeStr = dayjs(egyptTime).tz("Africa/Cairo").format("HH:mm");
  return timeStr >= startTime && timeStr < endTime;
};

// Generate time slots for a given day in Egypt timezone
export const generateTimeSlots = (
  date: string, // YYYY-MM-DD format
  startTime: string, // HH:MM format in Egypt timezone
  endTime: string, // HH:MM format in Egypt timezone
  intervalMinutes: number = 60
): string[] => {
  const slots: string[] = [];

  const startDateTime = dayjs.tz(`${date}T${startTime}`, "Africa/Cairo");
  const endDateTime = dayjs.tz(`${date}T${endTime}`, "Africa/Cairo");

  let currentTime = startDateTime;

  while (currentTime.isBefore(endDateTime)) {
    slots.push(currentTime.format("HH:mm"));
    currentTime = currentTime.add(intervalMinutes, "minute");
  }

  return slots;
};

// ===== EGYPT TIMEZONE STORAGE FUNCTIONS =====

// Convert availability settings to Egypt timezone for storage (without UTC conversion)
export const convertAvailabilityToEgyptStorage = (settings: {
  workingDays: number[];
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetweenSessions: number;
  isAvailable: boolean;
}) => {
  // Store Egypt times directly without any UTC conversion!
  // The times received are already in Egypt timezone, so keep them as-is
  return {
    workingDays: settings.workingDays,
    startTime: settings.startTime, // Keep original Egypt time (e.g., "09:00")
    endTime: settings.endTime, // Keep original Egypt time (e.g., "17:00")
    sessionDuration: settings.sessionDuration,
    breakBetweenSessions: settings.breakBetweenSessions,
    isAvailable: settings.isAvailable,
    // Mark as Egypt timezone storage - NO UTC conversion!
    storageType: "EGYPT_TIME",
    timezone: "Africa/Cairo",
  };
};

// Convert working hours to Egypt timezone for storage
export const convertWorkingHoursToEgyptStorage = (
  startTime: string, // HH:MM format
  endTime: string // HH:MM format
): { startTime: string; endTime: string; timezone: string } => {
  // Ensure times are properly formatted in Egypt timezone
  const egyptStartTime = dayjs
    .tz(`2000-01-01T${startTime}`, "Africa/Cairo")
    .format("HH:mm");
  const egyptEndTime = dayjs
    .tz(`2000-01-01T${endTime}`, "Africa/Cairo")
    .format("HH:mm");

  return {
    startTime: egyptStartTime,
    endTime: egyptEndTime,
    timezone: "Africa/Cairo",
  };
};

// Convert date and time to Egypt timezone ISO string for storage
export const toEgyptStorageString = (date: string, time: string): string => {
  // Create the datetime string with Egypt timezone
  const dateTimeString = `${date}T${time}`;
  // Parse as Egypt time and keep it as Egypt time (don't convert to UTC)
  const egyptDateTime = dayjs.tz(dateTimeString, "Africa/Cairo");

  // Return as ISO string but maintain Egypt timezone offset
  return egyptDateTime.format("YYYY-MM-DDTHH:mm:ss.SSS[+02:00]");
};

// ===== EGYPT TIMEZONE MANAGEMENT FUNCTIONS =====

// Create Egypt timezone date for database storage (keeps Egypt timezone)
export const createEgyptDateTime = (date: string, time: string): Date => {
  // Create datetime string and parse it in Egypt timezone
  const dateTimeString = `${date}T${time}`;
  const egyptDateTime = dayjs.tz(dateTimeString, "Africa/Cairo");

  // IMPORTANT: Create a Date object that represents the Egypt time as if it were local time
  // This prevents automatic UTC conversion by treating Egypt time as the "local" time
  const egyptAsLocal = new Date(
    egyptDateTime.year(),
    egyptDateTime.month(), // dayjs months are 0-based like Date
    egyptDateTime.date(),
    egyptDateTime.hour(),
    egyptDateTime.minute(),
    egyptDateTime.second(),
    egyptDateTime.millisecond()
  );

  console.log("createEgyptDateTime debug:", {
    input: { date, time },
    egyptDateTime: egyptDateTime.format(),
    egyptAsLocal: egyptAsLocal.toISOString(),
    localTime: egyptAsLocal.toLocaleString(),
  });

  return egyptAsLocal;
};

// Alternative function: Create Egypt datetime that stores exactly as Egypt time
export const createEgyptDateTimeForDB = (date: string, time: string): Date => {
  try {
    // Parse the Egypt date and time components
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    // Create Date object directly with Egypt time components
    // This bypasses timezone conversion entirely
    const egyptDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    console.log("createEgyptDateTimeForDB debug:", {
      input: { date, time },
      components: { year, month: month - 1, day, hours, minutes },
      result: egyptDateTime.toISOString(),
      displayTime: egyptDateTime.toLocaleString(),
    });

    return egyptDateTime;
  } catch (error) {
    console.error("Error creating Egypt datetime for DB:", error);
    // Fallback to current time
    return new Date();
  }
};

// Force any datetime to be treated as Egypt time without timezone conversion
export const treatAsEgyptTime = (dateTime: Date | string): Date => {
  try {
    if (typeof dateTime === "string") {
      // If it's a string, parse it as Egypt time
      const egyptMoment = dayjs.tz(dateTime, "Africa/Cairo");
      return new Date(
        egyptMoment.year(),
        egyptMoment.month(),
        egyptMoment.date(),
        egyptMoment.hour(),
        egyptMoment.minute(),
        egyptMoment.second()
      );
    }
    // If it's already a Date, treat it as Egypt time (no conversion)
    return dateTime;
  } catch (error) {
    console.error("Error treating as Egypt time:", error);
    return new Date();
  }
};

// Parse dates that are stored as Egypt time in database (no conversion needed)
export const parseEgyptStoredDate = (storedDate: Date | string): Date => {
  // Since the date is stored as Egypt time, we parse it directly without timezone conversion
  const date = new Date(storedDate);

  // Create a new date using the UTC components as if they were Egypt time
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
};

// Format dates that are stored as Egypt time for display
export const formatEgyptStoredDate = (
  storedDate: Date | string,
  formatPattern: string = "MMM D, YYYY"
): string => {
  try {
    const egyptDate = parseEgyptStoredDate(storedDate);
    return format(egyptDate, formatPattern);
  } catch (error) {
    console.error("Error formatting Egypt stored date:", error);
    return "Date not available";
  }
};

// Format time that is stored as Egypt time for display
export const formatEgyptStoredTime = (
  storedDate: Date | string,
  formatPattern: string = "h:mm a"
): string => {
  try {
    const egyptDate = parseEgyptStoredDate(storedDate);
    return format(egyptDate, formatPattern);
  } catch (error) {
    console.error("Error formatting Egypt stored time:", error);
    return "Time not available";
  }
};

// Validate that times are properly stored in Egypt timezone
export const validateEgyptTimezone = (dateTime: Date | string): boolean => {
  try {
    const egyptTime = dayjs(dateTime).tz("Africa/Cairo");
    // Check if the time can be properly parsed and converted
    return egyptTime.isValid();
  } catch (error) {
    console.error("Error validating Egypt timezone:", error);
    return false;
  }
};

// Display Egypt timezone datetime for UI confirmation
export const displayEgyptDateTime = (dateTime: Date): string => {
  return dayjs(dateTime).tz("Africa/Cairo").format("YYYY-MM-DD HH:mm");
};

// ===== SIMPLE LOCAL TIME FUNCTIONS (NO TIMEZONE CONVERSION) =====

// Simple function to format time string to 12-hour format
export const formatTimeSimple = (timeString: string): string => {
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }

  const [hours, minutes] = timeString.split(":").map(Number);
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? "PM" : "AM";

  return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

// Simple function to format date for display
export const formatDateSimple = (dateString: string): string => {
  try {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// Simple function to create datetime for storage (Egypt timezone)
export const createSimpleDateTime = (date: string, time: string): Date => {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    console.log(
      `Creating Egypt time: ${date} ${time} (Input: ${hours}:${minutes})`
    );

    // Create date in Egypt timezone using dayjs
    const egyptTime = dayjs.tz(
      `${date} ${time}`,
      "YYYY-MM-DD HH:mm",
      "Africa/Cairo"
    );

    // Create Date object with UTC components matching Egypt time
    // This way, when stored in DB, it shows the Egypt time directly
    const result = new Date(
      Date.UTC(
        year,
        month - 1, // Month is 0-indexed
        day,
        hours, // Use Egypt hours directly as UTC hours
        minutes, // Use Egypt minutes directly as UTC minutes
        0,
        0
      )
    );

    console.log(`Egypt time input: ${hours}:${minutes}`);
    console.log(`Created date (UTC components): ${result.toISOString()}`);
    console.log(
      `This will display as: ${result.getUTCHours()}:${result
        .getUTCMinutes()
        .toString()
        .padStart(2, "0")} UTC`
    );
    console.log(`But represents Egypt time: ${hours}:${minutes}`);

    return result;
  } catch (error) {
    console.error("Error creating Egypt datetime:", error);
    return new Date();
  }
};

// Simple function to format datetime for display (treats stored data as Egypt time)
export const formatSimpleDateTime = (
  date: Date | string,
  format?: string
): string => {
  const dateObj = new Date(date);

  // Since we store Egypt time as UTC components, we use UTC methods to get the "Egypt" time back
  if (
    format === "MMM D, YYYY" ||
    format === "MMM DD, YYYY" ||
    format === "MMMM D, YYYY"
  ) {
    const utcDate = new Date(dateObj.getTime());
    return utcDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC", // Use UTC to get the stored Egypt time components
    });
  }

  if (format === "h:mm A" || format === "h:mm a") {
    const utcDate = new Date(dateObj.getTime());
    return utcDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC", // Use UTC to get the stored Egypt time components
    });
  }
  // Default format
  const utcDate = new Date(dateObj.getTime());
  return (
    utcDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }) +
    " " +
    utcDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    })
  );
};
