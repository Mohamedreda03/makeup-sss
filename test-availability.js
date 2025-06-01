// Simple test script to verify time slots generation
const DEFAULT_BUSINESS_HOURS = {
  start: 10, // 10 AM
  end: 22, // 10 PM (22:00)
  interval: 30, // 30 minute intervals
};

console.log("Expected time slots for a day:");
console.log("Start:", DEFAULT_BUSINESS_HOURS.start + ":00");
console.log("End:", DEFAULT_BUSINESS_HOURS.end + ":00");
console.log("Interval:", DEFAULT_BUSINESS_HOURS.interval + " minutes");
console.log();

console.log("Generated time slots:");
for (
  let hour = DEFAULT_BUSINESS_HOURS.start;
  hour < DEFAULT_BUSINESS_HOURS.end;
  hour++
) {
  for (let minute = 0; minute < 60; minute += DEFAULT_BUSINESS_HOURS.interval) {
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    const timeObj = new Date();
    timeObj.setHours(hour, minute, 0, 0);
    const label = timeObj.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    console.log(`${timeStr} -> ${label}`);
  }
}

console.log();
console.log(
  "Total slots per day:",
  ((DEFAULT_BUSINESS_HOURS.end - DEFAULT_BUSINESS_HOURS.start) * 60) /
    DEFAULT_BUSINESS_HOURS.interval
);
