// Check database for bookings
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkDatabaseBookings() {
  try {
    console.log('=== Checking Database Bookings ===');
      // Get all bookings
    const allBookings = await prisma.booking.findMany({
      include: {
        artist: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        date_time: 'asc'
      }
    });
    
    console.log(`Total bookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('\nBookings details:');
      allBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
        console.log(`   Date & Time: ${booking.date_time}`);
        console.log(`   Status: ${booking.booking_status}`);
        console.log(`   Service: ${booking.service_type}`);
        console.log(`   Artist: ${booking.artist?.user?.name || 'Unknown'}`);
        console.log(`   Artist ID: ${booking.artist_id}`);
      });
    }
      // Get all makeup artists
    const artists = await prisma.makeUpArtist.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`\nTotal makeup artists: ${artists.length}`);
    artists.forEach((artist, index) => {
      console.log(`${index + 1}. ${artist.user?.name} (ID: ${artist.id}, User ID: ${artist.user_id})`);
    });
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseBookings();
