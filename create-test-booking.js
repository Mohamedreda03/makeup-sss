// Create a test booking to verify the blocking logic
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBooking() {
  try {
    console.log('=== Creating Test Booking ===');
    
    // First, get the first makeup artist
    const artist = await prisma.makeUpArtist.findFirst({
      include: {
        User: true
      }
    });
    
    if (!artist) {
      console.log('No makeup artist found! Creating one first...');
      
      // Create a test user and artist
      const testUser = await prisma.user.create({
        data: {
          email: 'testartist@example.com',
          name: 'Test Artist',
          role: 'ARTIST',
          emailVerified: new Date()
        }
      });
      
      const testArtist = await prisma.makeUpArtist.create({
        data: {
          user_id: testUser.id,
          bio: 'Test artist for booking conflicts',
          experience_years: 5,
          earnings: 0
        }
      });
      
      console.log('Created test artist:', testArtist.id);
      
      // Create a test booking for tomorrow at 2:00 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2:00 PM
      
      const testBooking = await prisma.booking.create({
        data: {
          artist_id: testArtist.id,
          customer_email: 'testcustomer@example.com',
          customer_name: 'Test Customer',
          service_type: 'Makeup Application',
          date_time: tomorrow,
          booking_status: 'CONFIRMED',
          total_price: 100,
          payment_status: 'PAID'
        }
      });
      
      console.log('Created test booking:', {
        id: testBooking.id,
        date_time: testBooking.date_time,
        service_type: testBooking.service_type,
        status: testBooking.booking_status,
        artist_id: testBooking.artist_id
      });
      
    } else {
      console.log('Found existing artist:', artist.User?.name, 'ID:', artist.id);
      
      // Create a test booking for today at 2:00 PM
      const today = new Date();
      today.setHours(14, 0, 0, 0); // 2:00 PM
      
      const testBooking = await prisma.booking.create({
        data: {
          artist_id: artist.id,
          customer_email: 'testcustomer@example.com',
          customer_name: 'Test Customer',
          service_type: 'Makeup Application',
          date_time: today,
          booking_status: 'CONFIRMED',
          total_price: 100,
          payment_status: 'PAID'
        }
      });
      
      console.log('Created test booking:', {
        id: testBooking.id,
        date_time: testBooking.date_time,
        service_type: testBooking.service_type,
        status: testBooking.booking_status,
        artist_id: testBooking.artist_id
      });
    }
    
  } catch (error) {
    console.error('Error creating test booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBooking();
