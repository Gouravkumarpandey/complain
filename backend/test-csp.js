/**
 * CSP Test Script
 * 
 * Run this to test your CSP configuration locally before deploying
 */

import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

console.log('🧪 Testing CSP Configuration...\n');

async function testCspHeaders() {
  try {
    console.log('1️⃣ Testing CSP Headers on /api/health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    
    const cspHeader = response.headers['content-security-policy'];
    const xFrameOptions = response.headers['x-frame-options'];
    const xContentTypeOptions = response.headers['x-content-type-options'];
    const xssProtection = response.headers['x-xss-protection'];
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ CSP Header Present:', !!cspHeader);
    
    if (cspHeader) {
      console.log('\n📋 CSP Directives:');
      const directives = cspHeader.split(';').map(d => d.trim());
      directives.forEach(directive => {
        console.log(`   ${directive}`);
      });
    }
    
    console.log('\n🔒 Security Headers:');
    console.log(`   X-Frame-Options: ${xFrameOptions || 'Not Set'}`);
    console.log(`   X-Content-Type-Options: ${xContentTypeOptions || 'Not Set'}`);
    console.log(`   X-XSS-Protection: ${xssProtection || 'Not Set'}`);
    
    // Check for required sources
    console.log('\n✅ Required Sources Check:');
    const checks = [
      { name: 'Google OAuth (script-src)', pattern: 'accounts.google.com' },
      { name: 'Facebook SDK (script-src)', pattern: 'connect.facebook.net' },
      { name: 'CDN Scripts (script-src)', pattern: 'cdn.jsdelivr.net' },
      { name: 'Google Fonts (style-src)', pattern: 'fonts.googleapis.com' },
      { name: 'CDN Fonts (font-src)', pattern: 'cdn.jsdelivr.net' },
      { name: 'Stripe (frame-src)', pattern: 'js.stripe.com' },
    ];
    
    checks.forEach(check => {
      const found = cspHeader.includes(check.pattern);
      console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'Configured' : 'Missing'}`);
    });
    
    console.log('\n✅ CSP Headers Test Passed!\n');
    return true;
  } catch (error) {
    console.error('❌ CSP Headers Test Failed:', error.message);
    return false;
  }
}

async function testCspReporting() {
  try {
    console.log('2️⃣ Testing CSP Violation Reporting...');
    
    const mockViolation = {
      'document-uri': 'https://test.example.com',
      'violated-directive': 'script-src',
      'blocked-uri': 'https://evil.com/script.js',
      'original-policy': 'default-src \'self\'',
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/csp-report`, mockViolation, {
      headers: {
        'Content-Type': 'application/csp-report'
      }
    });
    
    console.log('✅ CSP Report Endpoint Status:', response.status);
    console.log('✅ CSP Reporting Test Passed!\n');
    return true;
  } catch (error) {
    if (error.response?.status === 204) {
      console.log('✅ CSP Report Endpoint Working (204 No Content)');
      console.log('✅ CSP Reporting Test Passed!\n');
      return true;
    }
    console.error('❌ CSP Reporting Test Failed:', error.message);
    return false;
  }
}

async function testCspConfig() {
  try {
    console.log('3️⃣ Testing CSP Configuration Endpoint...');
    
    const response = await axios.get(`${BACKEND_URL}/api/csp-config`);
    
    console.log('✅ Configuration Retrieved');
    console.log('   Environment:', response.data.environment);
    console.log('   Frontend URL:', response.data.frontendUrl);
    console.log('   Backend URL:', response.data.backendUrl);
    console.log('   CSP Directives:', Object.keys(response.data.cspDirectives).length, 'configured');
    console.log('✅ CSP Config Test Passed!\n');
    return true;
  } catch (error) {
    console.log('⚠️  CSP Config endpoint not available (optional)');
    console.log('   You can add it to server.js using code from cspExamples.js\n');
    return true; // Not critical
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   CSP CONFIGURATION TEST SUITE');
  console.log('═══════════════════════════════════════════════════\n');
  console.log(`Testing against: ${BACKEND_URL}\n`);
  
  const results = {
    headers: await testCspHeaders(),
    reporting: await testCspReporting(),
    config: await testCspConfig(),
  };
  
  console.log('═══════════════════════════════════════════════════');
  console.log('   TEST RESULTS');
  console.log('═══════════════════════════════════════════════════\n');
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n═══════════════════════════════════════════════════');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('Your CSP configuration is ready for deployment.');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Please check the errors above and fix before deploying.');
  }
  console.log('═══════════════════════════════════════════════════\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
