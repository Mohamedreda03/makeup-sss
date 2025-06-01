const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugArtistIds() {
  try {
    console.log("=== Debug Artist IDs ===");

    // Get the specific artist from URL
    const urlArtistId = "7a0f513c-72d3-4ed4-99b4-7942c493eda6";

    // Find user with this ID
    const user = await prisma.user.findUnique({
      where: { id: urlArtistId },
      select: { id: true, name: true, role: true },
    });

    console.log("User found:", user);

    // Find makeup artist record for this user
    const makeupArtist = await prisma.makeUpArtist.findFirst({
      where: { user_id: urlArtistId },
      select: { id: true, user_id: true, name: true, specialties: true },
    });

    console.log("MakeupArtist record:", makeupArtist);

    // Get bookings for this makeup artist (if found)
    if (makeupArtist) {
      const bookings = await prisma.booking.findMany({
        where: {
          artist_id: makeupArtist.id,
          booking_status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: {
          id: true,
          date_time: true,
          service_type: true,
          booking_status: true,
        },
        orderBy: { date_time: "asc" },
      });

      console.log(
        `Bookings for makeup artist ${makeupArtist.id}:`,
        bookings.length
      );
      bookings.forEach((booking, index) => {
        console.log(
          `${index + 1}. ${booking.date_time} - ${booking.service_type} (${
            booking.booking_status
          })`
        );
      });
    }

    console.log("\n=== All Users with ARTIST role ===");
    const allArtists = await prisma.user.findMany({
      where: { role: "ARTIST" },
      select: { id: true, name: true },
    });

    for (const artist of allArtists) {
      const makeupRecord = await prisma.makeUpArtist.findFirst({
        where: { user_id: artist.id },
        select: { id: true, name: true },
      });

      console.log(
        `User: ${artist.name} (${artist.id}) -> MakeupArtist: ${makeupRecord?.name} (${makeupRecord?.id})`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugArtistIds();
