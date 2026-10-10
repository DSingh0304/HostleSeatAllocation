const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
  console.log('--- Starting API E2E Tests ---');
  
  console.log('\\n1. Admin Login');
  let res = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@iiituna.ac.in', password: 'password123' })
  });
  let adminData = await res.json();
  const adminToken = adminData.token;
  console.log('Admin Token Received:', !!adminToken);

  console.log('\\n2. Student Login');
  res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rollNumber: 'TEST1001', password: 'Test@123' })
  });
  let studentData = await res.json();
  const studentToken = studentData.token;
  console.log('Student Token Received:', !!studentToken);

  if (!studentToken) {
    console.error('Login Failed', studentData);
    return;
  }

  res = await fetch(`${API_URL}/student/profile`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const profile = await res.json();
  console.log('Student Profile:', profile.name, profile.rollNumber);

  res = await fetch(`${API_URL}/student/active-window`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const window = await res.json();
  console.log('Active Window:', window ? window.name : 'None');

  res = await fetch(`${API_URL}/student/hostels`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const hostels = await res.json();
  console.log('Eligible Hostels:', hostels.length);

  if (hostels.length > 0) {
    const hostel = hostels[0];
    res = await fetch(`${API_URL}/student/hostels/${hostel.id}/rooms`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const rooms = await res.json();
    console.log(`Rooms in ${hostel.name}:`, rooms.length);

    if (rooms.length > 0 && window) {
      const room = rooms[0];
      console.log(`\\nAttempting to book Room ${room.roomNumber}...`);
      res = await fetch(`${API_URL}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({ roomId: room.id, windowId: window.id })
      });
      const bookRes = await res.json();
      console.log('Booking Response:', res.status, bookRes);
      
      if (res.status === 201) {
        console.log(`\\nAttempting to cancel booking ${bookRes.id}...`);
        res = await fetch(`${API_URL}/allocations/${bookRes.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        console.log('Cancellation Response:', res.status);
      }
    }
  }

  console.log('\\n--- Tests Completed ---');
}

runTest();
