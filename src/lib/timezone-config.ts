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
  // Create a date string in Egypt timezone
  const dateString = `${year}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
    .toString()
    .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second
    .toString()
    .padStart(2, "0")}.000`;

  // Parse the date as if it's in Egypt timezone
  const date = new Date(dateString);

  // Get the timezone offset for Egypt
  const egyptDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.timezone })
  );
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const offset = egyptDate.getTime() - utcDate.getTime();

  // Adjust for timezone
  return new Date(date.getTime() - offset);
};

// Convert any date to Egypt timezone
export const toEgyptTime = (date: Date): Date => {
  return new Date(date.toLocaleString("en-US", { timeZone: TIMEZONE_CONFIG.timezone }));
};

// Get current time in Egypt timezone
export const nowInEgypt = (): Date => {
  return toEgyptTime(new Date());
};

// Format date in Egypt timezone
export const formatInEgypt = (date: Date): string => {
  const egyptDate = toEgyptTime(date);
  return egyptDate.toLocaleString("en-CA", { 
    timeZone: TIMEZONE_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/,/, '');
};

// Check if two dates are the same day in Egypt timezone
export const isSameDayInEgypt = (date1: Date, date2: Date): boolean => {
  const egypt1 = toEgyptTime(date1);
  const egypt2 = toEgyptTime(date2);
  
  return egypt1.getFullYear() === egypt2.getFullYear() &&
         egypt1.getMonth() === egypt2.getMonth() &&
         egypt1.getDate() === egypt2.getDate();
};
