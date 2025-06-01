// Test script to check booking API
const fetch = require('node-fetch');

async function testAvailabilityAPI() {
  try {
    // First, let's get all artists
    const artistsResponse = await fetch('http://localhost:3000/api/artists');
    const artists = await artistsResponse.json();
    
    console.log('Available artists:', artists.length);
    
    if (artists.length > 0) {
      const firstArtist = artists[0];
      console.log('Testing with artist:', firstArtist.name, 'ID:', firstArtist.id);
      
      // Test availability API
      const availabilityResponse = await fetch(`http://localhost:3000/api/artists/${firstArtist.id}/availability`);
      const availability = await availabilityResponse.json();
      
      console.log('\nAvailability Response:');
      console.log('Artist Name:', availability.artistName);
      console.log('Is Available:', availability.isAvailable);
      console.log('Days with availability:', availability.availability?.length || 0);
      
      // Check first day's time slots
      if (availability.availability && availability.availability.length > 0) {
        const firstDay = availability.availability[0];
        console.log('\nFirst day:', firstDay.date);
        console.log('Total time slots:', firstDay.timeSlots?.length || 0);
        console.log('Booked slots:', firstDay.timeSlots?.filter(slot => slot.isBooked).length || 0);
        console.log('Available slots:', firstDay.timeSlots?.filter(slot => !slot.isBooked).length || 0);
        
        // Show first few time slots
        if (firstDay.timeSlots && firstDay.timeSlots.length > 0) {
          console.log('\nFirst 5 time slots:');
          firstDay.timeSlots.slice(0, 5).forEach(slot => {
            console.log(`  ${slot.label} - ${slot.isBooked ? 'BOOKED' : 'AVAILABLE'}`);
          });
        }
      }
    }
    
    // Also check if there are any bookings in the database
    console.log('\n=== Checking bookings directly ===');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAvailabilityAPI();
