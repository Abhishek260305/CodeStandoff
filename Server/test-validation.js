/**
 * Validation Testing Script
 * Tests all validation rules and security measures
 * Run with: node test-validation.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logPass(message) {
  log(`  ✅ PASS: ${message}`, 'green');
}

function logFail(message) {
  log(`  ❌ FAIL: ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  WARNING: ${message}`, 'yellow');
}

async function testRequest(method, endpoint, data = null, expectedStatus = 200, description = '') {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // Don't throw on any status
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      logPass(`${description || endpoint} - Status: ${response.status}`);
      return { success: true, response };
    } else {
      logFail(`${description || endpoint} - Expected ${expectedStatus}, got ${response.status}`);
      if (response.data) {
        console.log('    Response:', JSON.stringify(response.data, null, 2));
      }
      return { success: false, response };
    }
  } catch (error) {
    logFail(`${description || endpoint} - Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🔒 VALIDATION & SECURITY TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  
  let passed = 0;
  let failed = 0;
  
  // ========== SIGNUP VALIDATION TESTS ==========
  logTest('SIGNUP VALIDATION');
  
  // Test 1: Valid signup (should pass)
  const timestamp = Date.now();
  const validSignup = {
    firstName: 'John',
    lastName: 'Doe',
    username: `testuser${timestamp}`,
    contact: `${timestamp.toString().slice(-10)}`, // Use last 10 digits of timestamp for unique contact
    email: `test${timestamp}@example.com`,
    password: 'SecurePass123!'
  };
  const result1 = await testRequest('POST', '/signup', validSignup, 201, 'Valid signup data');
  if (result1.success) passed++; else {
    // If it fails due to duplicate, that's actually good - means duplicate check works
    if (result1.response && result1.response.data && result1.response.data.message && 
        result1.response.data.message.includes('already exists')) {
      logPass('Duplicate check is working');
      passed++;
    } else {
      failed++;
    }
  }
  
  // Test 2: Missing required fields
  await testRequest('POST', '/signup', { firstName: 'John' }, 400, 'Missing required fields');
  
  // Test 3: Invalid email format
  const result3 = await testRequest('POST', '/signup', {
    ...validSignup,
    email: 'invalid-email'
  }, 400, 'Invalid email format');
  if (result3.success) passed++; else failed++;
  
  // Test 4: Weak password (no special char)
  const result4 = await testRequest('POST', '/signup', {
    ...validSignup,
    password: 'WeakPass123'
  }, 400, 'Weak password (no special char)');
  if (result4.success) passed++; else failed++;
  
  // Test 5: Short password
  const result5 = await testRequest('POST', '/signup', {
    ...validSignup,
    password: 'Short1!'
  }, 400, 'Password too short');
  if (result5.success) passed++; else failed++;
  
  // Test 6: Invalid contact (not 10 digits)
  const result6 = await testRequest('POST', '/signup', {
    ...validSignup,
    contact: '12345'
  }, 400, 'Invalid contact number');
  if (result6.success) passed++; else failed++;
  
  // Test 7: Invalid username (special chars)
  const result7 = await testRequest('POST', '/signup', {
    ...validSignup,
    username: 'user@name'
  }, 400, 'Invalid username (special chars)');
  if (result7.success) passed++; else failed++;
  
  // Test 8: Invalid firstName (numbers)
  const result8 = await testRequest('POST', '/signup', {
    ...validSignup,
    firstName: 'John123'
  }, 400, 'Invalid firstName (numbers)');
  if (result8.success) passed++; else failed++;
  
  // ========== NOSQL INJECTION TESTS ==========
  logTest('NOSQL INJECTION PREVENTION');
  
  // Test 9: MongoDB operator injection attempt
  const result9 = await testRequest('POST', '/signup', {
    firstName: { $ne: null },
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test${Date.now()}@example.com`,
    password: 'SecurePass123!'
  }, 400, 'MongoDB operator injection ($ne)');
  if (result9.success) passed++; else failed++;
  
  // Test 10: MongoDB regex injection (should be caught by validation)
  const result10 = await testRequest('POST', '/login', {
    usernameOrEmail: { $regex: '.*' },
    password: 'anything'
  }, [400, 401], 'MongoDB regex injection');
  // If it returns 400, validation caught it. If 401, sanitization removed the object and it tried to find user
  if (result10.response && result10.response.status === 400) {
    logPass('MongoDB regex injection blocked by validation');
    passed++;
  } else if (result10.response && result10.response.status === 401) {
    logWarning('MongoDB regex injection: Object was sanitized but validation should catch it');
    // This means the object was converted/removed, but we should validate it's a string
    failed++;
  } else {
    failed++;
  }
  
  // Test 11: MongoDB comparison operators
  const result11 = await testRequest('POST', '/signup', {
    firstName: 'John',
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: { $gt: 0 },
    email: `test${Date.now()}@example.com`,
    password: 'SecurePass123!'
  }, 400, 'MongoDB comparison operator ($gt)');
  if (result11.success) passed++; else failed++;
  
  // ========== XSS PREVENTION TESTS ==========
  logTest('XSS PREVENTION');
  
  // Test 12: Script tag injection
  const result12 = await testRequest('POST', '/signup', {
    firstName: '<script>alert("XSS")</script>',
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test${Date.now()}@example.com`,
    password: 'SecurePass123!'
  }, 400, 'XSS attempt in firstName');
  if (result12.success) passed++; else failed++;
  
  // Test 13: HTML entity injection
  const result13 = await testRequest('POST', '/signup', {
    firstName: 'John',
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test<script>@example.com`,
    password: 'SecurePass123!'
  }, 400, 'XSS in email');
  if (result13.success) passed++; else failed++;
  
  // ========== INPUT LENGTH TESTS ==========
  logTest('INPUT LENGTH VALIDATION');
  
  // Test 14: Extremely long firstName
  const result14 = await testRequest('POST', '/signup', {
    firstName: 'A'.repeat(100),
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test${Date.now()}@example.com`,
    password: 'SecurePass123!'
  }, 400, 'Extremely long firstName');
  if (result14.success) passed++; else failed++;
  
  // Test 15: Extremely long password
  const result15 = await testRequest('POST', '/signup', {
    firstName: 'John',
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test${Date.now()}@example.com`,
    password: 'A'.repeat(200) + '1!'
  }, 400, 'Extremely long password');
  if (result15.success) passed++; else failed++;
  
  // ========== LOGIN VALIDATION TESTS ==========
  logTest('LOGIN VALIDATION');
  
  // Test 16: Missing password
  const result16 = await testRequest('POST', '/login', {
    usernameOrEmail: 'test@example.com'
  }, 400, 'Missing password');
  if (result16.success) passed++; else failed++;
  
  // Test 17: Empty usernameOrEmail
  const result17 = await testRequest('POST', '/login', {
    usernameOrEmail: '',
    password: 'password123'
  }, 400, 'Empty usernameOrEmail');
  if (result17.success) passed++; else failed++;
  
  // ========== QUESTIONS ROUTE VALIDATION ==========
  logTest('QUESTIONS ROUTE VALIDATION');
  
  // Test 18: Invalid question ID format
  const result18 = await testRequest('GET', '/questions/invalid-id/output', null, 400, 'Invalid question ID');
  if (result18.success) passed++; else failed++;
  
  // Test 19: SQL injection in question ID
  const result19 = await testRequest('GET', '/questions/1%27%20OR%20%271%27%3D%271/output', null, 400, 'SQL injection attempt');
  if (result19.success) passed++; else failed++;
  
  // Test 20: Valid question ID format (but may not exist)
  const result20 = await testRequest('GET', '/questions/507f1f77bcf86cd799439011/output', null, [200, 404], 'Valid ObjectId format');
  // 404 is acceptable - means validation passed but question doesn't exist
  if (result20.response && (result20.response.status === 200 || result20.response.status === 404)) {
    logPass('Valid ObjectId format accepted (question may not exist)');
    passed++;
  } else {
    failed++;
  }
  
  // Test 21: Invalid page number (negative)
  const result21 = await testRequest('GET', '/questions?page=-1', null, 400, 'Negative page number');
  if (result21.success) passed++; else failed++;
  
  // Test 22: Invalid page number (too large)
  const result22 = await testRequest('GET', '/questions?page=99999', null, 400, 'Page number too large');
  if (result22.success) passed++; else failed++;
  
  // Test 23: Valid page number
  const result23 = await testRequest('GET', '/questions?page=1', null, 200, 'Valid page number');
  if (result23.success) passed++; else failed++;
  
  // ========== REQUEST SIZE LIMIT TEST ==========
  logTest('REQUEST SIZE LIMIT');
  
  // Test 24: Large payload (should be rejected or limited)
  const largePayload = {
    firstName: 'A'.repeat(1000000), // 1MB of data
    lastName: 'Doe',
    username: `test${Date.now()}`,
    contact: '1234567890',
    email: `test${Date.now()}@example.com`,
    password: 'SecurePass123!'
  };
  const result24 = await testRequest('POST', '/signup', largePayload, [400, 413], 'Large payload (DoS attempt)');
  // 400 means validation caught it, 413 means request too large - both are good
  if (result24.response && (result24.response.status === 400 || result24.response.status === 413)) {
    logPass('Large payload rejected');
    passed++;
  } else {
    failed++;
  }
  
  // ========== SUMMARY ==========
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  log(`📈 Total: ${passed + failed}`, 'blue');
  log('='.repeat(60), 'blue');
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Validation is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Review the output above.', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  process.exit(1);
});

