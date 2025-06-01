const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const urlId = "7a0f513c-72d3-4ed4-99b4-7942c493eda6";

  console.log("=== Debug Artist Mapping ===");

  const user = await prisma.user.findUnique({
    where: { id: urlId },
    select: { id: true, name: true, role: true },
  });
  console.log("User found:", user);

  const makeupArtist = await prisma.makeUpArtist.findFirst({
    where: { user_id: urlId },
    select: { id: true, name: true },
  });
  console.log("MakeupArtist found:", makeupArtist);

  if (makeupArtist) {
    const bookings = await prisma.booking.findMany({
      where: {
        artist_id: makeupArtist.id,
        booking_status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { date_time: true, service_type: true, booking_status: true },
    });
    console.log(`Active bookings: ${bookings.length}`);

    // Show Monday June 2, 2025 bookings
    const mondayBookings = bookings.filter((b) => {
      const date = new Date(b.date_time);
      return (
        date.getDate() === 2 &&
        date.getMonth() === 5 &&
        date.getFullYear() === 2025
      );
    });

    console.log("Monday June 2 bookings:", mondayBookings.length);
    mondayBookings.forEach((b) => {
      console.log(`  - ${b.date_time} ${b.service_type} (${b.booking_status})`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
