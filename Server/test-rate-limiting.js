const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

const test = async (name, fn) => {
  process.stdout.write(`  🧪 ${name} - `);
  try {
    await fn();
    console.log('✅ PASS');
    return true;
  } catch (error) {
    console.error('❌ FAIL');
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Response:`, error.response.data);
    } else {
      console.error('    Error:', error.message);
    }
    return false;
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
  console.log('\n============================================================');
  console.log('🛡️  RATE LIMITING TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Login rate limiting (5 attempts per 15 minutes)
  console.log('🧪 Testing: LOGIN RATE LIMITING (5 attempts per 15 min)');
  console.log('   Making 6 login attempts rapidly...\n');

  for (let i = 1; i <= 6; i++) {
    const result = await test(`Login attempt ${i}`, async () => {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        usernameOrEmail: 'testuser',
        password: 'wrongpassword'
      }, {
        validateStatus: (status) => status < 600 // Accept all status codes
      });

      if (i <= 5) {
        // First 5 attempts should be allowed (even if they fail)
        if (response.status === 429) {
          throw new Error(`Expected attempt ${i} to be allowed, but got 429`);
        }
      } else {
        // 6th attempt should be rate limited
        if (response.status !== 429) {
          throw new Error(`Expected attempt 6 to be rate limited (429), but got ${response.status}`);
        }
        if (!response.data.message || !response.data.message.includes('Too many login attempts')) {
          throw new Error('Rate limit response message is incorrect');
        }
      }
    });

    if (result) passed++;
    else failed++;

    // Small delay between requests
    await sleep(100);
  }

  console.log('\n🧪 Testing: SIGNUP RATE LIMITING (3 attempts per hour)');
  console.log('   Making 4 signup attempts rapidly...\n');

  // Test 2: Signup rate limiting (3 attempts per hour)
  for (let i = 1; i <= 4; i++) {
    const result = await test(`Signup attempt ${i}`, async () => {
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        firstName: 'Test',
        lastName: 'User',
        username: `testuser${Date.now()}${i}`, // Unique username each time
        contact: `123456789${i}`,
        email: `test${Date.now()}${i}@example.com`,
        password: 'Password123!'
      }, {
        validateStatus: (status) => status < 600
      });

      if (i <= 3) {
        // First 3 attempts should be allowed
        if (response.status === 429) {
          throw new Error(`Expected attempt ${i} to be allowed, but got 429`);
        }
      } else {
        // 4th attempt should be rate limited
        if (response.status !== 429) {
          throw new Error(`Expected attempt 4 to be rate limited (429), but got ${response.status}`);
        }
        if (!response.data.message || !response.data.message.includes('Too many signup attempts')) {
          throw new Error('Rate limit response message is incorrect');
        }
      }
    });

    if (result) passed++;
    else failed++;

    await sleep(100);
  }

  console.log('\n🧪 Testing: GENERAL API RATE LIMITING (100 requests per 15 min)');
  console.log('   Making 5 requests to /health endpoint (should not be rate limited)...\n');

  // Test 3: General API rate limiting (health endpoint should be excluded)
  for (let i = 1; i <= 5; i++) {
    const result = await test(`Health check ${i}`, async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    if (result) passed++;
    else failed++;

    await sleep(50);
  }

  console.log('\n🧪 Testing: RATE LIMIT HEADERS');
  const result = await test('Rate limit headers present', async () => {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      usernameOrEmail: 'testuser',
      password: 'wrongpassword'
    }, {
      validateStatus: (status) => status < 600
    });

    // Check for rate limit headers
    const rateLimitHeader = response.headers['ratelimit-limit'];
    const rateLimitRemaining = response.headers['ratelimit-remaining'];
    
    if (!rateLimitHeader) {
      throw new Error('Rate limit headers not present');
    }
  });

  if (result) passed++;
  else failed++;

  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Review the output above.');
    console.log('💡 Note: Rate limiting uses in-memory storage by default.');
    console.log('   If server was restarted, rate limit counters reset.');
    process.exit(1);
  } else {
    console.log('🎉 All rate limiting tests passed!');
    console.log('\n💡 Rate Limiting Configuration:');
    console.log('   - Login: 5 attempts per 15 minutes');
    console.log('   - Signup: 3 attempts per hour');
    console.log('   - General API: 100 requests per 15 minutes');
    console.log('   - Health endpoint: Excluded from rate limiting');
  }
};

// Check if server is running
axios.get(`${API_BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running. Starting rate limiting tests...\n');
    runTests();
  })
  .catch((error) => {
    console.error('❌ Server is not running or not accessible at', API_BASE_URL);
    console.error('   Please start the server first: cd Server && node server.js');
    process.exit(1);
  });

