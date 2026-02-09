#!/usr/bin/env node

/**
 * Admin Login Test Script
 * Tests the hardcoded admin login functionality
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login System\n');
    console.log('='.repeat(50));

    // Test 1: Valid Admin Login
    console.log('\n✅ Test 1: Valid Admin Credentials');
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'pandeygourav2002@gmail.com',
                password: 'Gourav#710'
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('   ✓ Admin login successful');
            console.log('   ✓ Token received:', data.token ? 'Yes' : 'No');
            console.log('   ✓ User role:', data.user?.role);
            console.log('   ✓ User name:', data.user?.name);
        } else {
            console.log('   ✗ Admin login failed:', data.message);
        }
    } catch (error) {
        console.log('   ✗ Error:', error.message);
    }

    // Test 2: Invalid Admin Credentials
    console.log('\n❌ Test 2: Invalid Admin Credentials');
    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'wrong@email.com',
                password: 'wrongpassword'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log('   ✓ Correctly rejected invalid credentials');
            console.log('   ✓ Error message:', data.message);
        } else {
            console.log('   ✗ Should have rejected invalid credentials!');
        }
    } catch (error) {
        console.log('   ✗ Error:', error.message);
    }

    // Test 3: Admin Signup Blocked
    console.log('\n🚫 Test 3: Admin Signup Blocked');
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Admin',
                email: 'testadmin@test.com',
                password: 'password123',
                role: 'admin'
            })
        });

        const data = await response.json();

        if (response.status === 403) {
            console.log('   ✓ Correctly blocked admin signup');
            console.log('   ✓ Error message:', data.message);
        } else {
            console.log('   ✗ Should have blocked admin signup!');
        }
    } catch (error) {
        console.log('   ✗ Error:', error.message);
    }

    // Test 4: Regular User Signup Works
    console.log('\n👤 Test 4: Regular User Signup (Should Work)');
    try {
        const randomEmail = `testuser${Date.now()}@test.com`;
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: randomEmail,
                password: 'password123',
                role: 'user',
                phoneNumber: '+919876543210'
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('   ✓ Regular user signup works');
            console.log('   ✓ User role:', data.user?.role);
            console.log('   ✓ Requires verification:', data.requiresVerification);
        } else {
            console.log('   ⚠ Signup response:', data.message);
        }
    } catch (error) {
        console.log('   ✗ Error:', error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n✨ Admin Login Tests Complete!\n');
}

// Run tests
testAdminLogin().catch(console.error);
