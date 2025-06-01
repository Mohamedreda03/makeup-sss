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
  // Create date in target timezone, not system timezone
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:00${TIMEZONE_CONFIG.defaultOffset}`;
  return new Date(dateStr);
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
