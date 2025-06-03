// Test script for timezone handling
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  formatTimeToEgypt12h,
  formatDateToEgyptLocale,
  toEgyptISOString,
  TIMEZONE_CONFIG,
} from "./timezone-config";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Test various time formats
console.log("=== TIMEZONE TEST SCRIPT ===");
console.log(`Target timezone: ${TIMEZONE_CONFIG.timezone}`);

// Current time
const now = new Date();
console.log("Current time:");
console.log(`- Local time: ${now.toLocaleString()}`);
console.log(
  `- Egypt time: ${now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })}`
);
console.log(`- dayjs Egypt time: ${dayjs().tz("Africa/Cairo").format()}`);

// Test formatTimeToEgypt12h
const testTimes = ["09:00", "13:30", "17:45", "00:15"];
console.log("\nTime formatting tests (HH:MM → h:mm A):");
testTimes.forEach((time) => {
  console.log(`- ${time} → ${formatTimeToEgypt12h(time)}`);
});

// Test formatDateToEgyptLocale
const testDates = ["2025-06-01", "2025-12-25", "2026-01-01"];
console.log("\nDate formatting tests (YYYY-MM-DD → localized):");
testDates.forEach((date) => {
  console.log(`- ${date} → ${formatDateToEgyptLocale(date)}`);
});

// Test combined date and time
console.log("\nCombined date and time tests:");
testDates.slice(0, 1).forEach((date) => {
  testTimes.slice(0, 2).forEach((time) => {
    console.log(`- ${date} ${time} → ${toEgyptISOString(date, time)}`);
  });
});
