// Test script to debug complaint submission
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001/api';

// Step 1: Login to get token
async function login() {
  console.log('🔐 Step 1: Logging in...');
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Login failed:', data);
      return null;
    }

    console.log('✅ Login successful');
    console.log('   Token:', data.token ? '***' + data.token.slice(-10) : 'NO TOKEN');
    console.log('   User:', data.user);
    return data.token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

// Step 2: Submit complaint
async function submitComplaint(token) {
  console.log('\n📝 Step 2: Submitting complaint...');
  try {
    const complaintData = {
      title: 'Test complaint from debug script',
      description: 'This is a detailed description of my complaint. I am testing if complaints are being saved to MongoDB correctly.',
      category: 'Technical Support'
    };

    console.log('   Payload:', JSON.stringify(complaintData, null, 2));
    console.log('   Token:', token ? 'Bearer ***' + token.slice(-10) : 'NO TOKEN');

    const response = await fetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(complaintData)
    });

    console.log('   Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('   Response body:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('   Failed to parse JSON response');
      return;
    }

    if (!response.ok) {
      console.error('❌ Complaint submission failed:', data);
      return;
    }

    console.log('✅ Complaint submitted successfully!');
    console.log('   Complaint ID:', data._id || data.id);
    console.log('   Complaint Number:', data.complaintId);
    console.log('   Status:', data.status);
    console.log('   Category:', data.category);
    console.log('   Priority:', data.priority);

    return data;
  } catch (error) {
    console.error('❌ Submission error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Step 3: Verify complaint in database
async function verifyComplaint(token, complaintId) {
  console.log('\n🔍 Step 3: Verifying complaint in database...');
  try {
    const response = await fetch(`${API_URL}/complaints/${complaintId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Verification failed:', data);
      return;
    }

    console.log('✅ Complaint found in database!');
    console.log('   Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

// Run the test
async function runTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 COMPLAINT SUBMISSION DEBUG TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  const token = await login();
  if (!token) {
    console.error('\n❌ Cannot proceed without authentication token');
    return;
  }

  const complaint = await submitComplaint(token);
  if (!complaint) {
    console.error('\n❌ Test failed: Complaint was not created');
    return;
  }

  const complaintId = complaint._id || complaint.id;
  if (complaintId) {
    await verifyComplaint(token, complaintId);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

runTest().catch(console.error);
