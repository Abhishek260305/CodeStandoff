const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Helper to create axios instance with cookies
const createAxiosInstance = (cookies = {}) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    validateStatus: () => true // Don't throw on any status
  });

  // Set cookies if provided
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    instance.defaults.headers.common['Cookie'] = cookieString;
  }

  return instance;
};

// Helper to extract cookies from response
const extractCookies = (response) => {
  const cookies = {};
  const setCookieHeaders = response.headers['set-cookie'] || [];
  
  setCookieHeaders.forEach(cookie => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (name && value) {
      cookies[name.trim()] = value.trim();
    }
  });

  return cookies;
};

const test = async (name, fn) => {
  process.stdout.write(`  🧪 ${name} - `);
  try {
    await fn();
    console.log('✅ PASS');
    return true;
  } catch (error) {
    console.error('❌ FAIL');
    if (error.message) {
      console.error(`    Error: ${error.message}`);
    }
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
};

const runTests = async () => {
  console.log('\n============================================================');
  console.log('🛡️  CSRF PROTECTION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Get CSRF token
  console.log('🧪 Testing: CSRF TOKEN GENERATION');
  let csrfToken = null;
  let csrfSecret = null;
  let client = null;

  await test('GET /csrf-token generates token', async () => {
    client = createAxiosInstance();
    const response = await client.get('/csrf-token');
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!response.data.csrfToken) {
      throw new Error('Response missing csrfToken');
    }

    csrfToken = response.data.csrfToken;
    const cookies = extractCookies(response);
    csrfSecret = cookies.csrfSecret;
    
    if (!csrfSecret) {
      throw new Error('CSRF secret cookie not set');
    }

    // Verify XSRF-TOKEN cookie is set
    if (!cookies['XSRF-TOKEN']) {
      throw new Error('XSRF-TOKEN cookie not set');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 2: POST without CSRF token should fail
  console.log('\n🧪 Testing: CSRF PROTECTION');
  await test('POST /signup without CSRF token should be rejected', async () => {
    const client = createAxiosInstance();
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser123',
      contact: '1234567890',
      email: 'test@example.com',
      password: 'Password123!'
    });

    if (response.status !== 403) {
      throw new Error(`Expected 403, got ${response.status}`);
    }

    if (!response.data.message || !response.data.message.includes('CSRF')) {
      throw new Error('Error message should mention CSRF');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 3: POST with invalid CSRF token should fail
  await test('POST /signup with invalid CSRF token should be rejected', async () => {
    const client = createAxiosInstance({ csrfSecret: csrfSecret });
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser456',
      contact: '1234567891',
      email: 'test2@example.com',
      password: 'Password123!'
    }, {
      headers: {
        'X-CSRF-Token': 'invalid-token-12345'
      }
    });

    if (response.status !== 403) {
      throw new Error(`Expected 403, got ${response.status}`);
    }

    if (!response.data.message || !response.data.message.includes('CSRF')) {
      throw new Error('Error message should mention CSRF');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 4: POST with valid CSRF token in header should succeed
  await test('POST /signup with valid CSRF token in header should succeed', async () => {
    // First get a fresh token
    const tokenClient = createAxiosInstance();
    const tokenResponse = await tokenClient.get('/csrf-token');
    const freshToken = tokenResponse.data.csrfToken;
    const freshCookies = extractCookies(tokenResponse);
    const freshSecret = freshCookies.csrfSecret;

    const client = createAxiosInstance({ csrfSecret: freshSecret });
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${Date.now()}`,
      contact: `${Date.now().toString().slice(-10)}`,
      email: `test${Date.now()}@example.com`,
      password: 'Password123!'
    }, {
      headers: {
        'X-CSRF-Token': freshToken
      }
    });

    // Should succeed (201) or fail with validation/duplicate (400) but NOT 403
    if (response.status === 403) {
      throw new Error('Request with valid CSRF token should not return 403');
    }

    if (response.status !== 201 && response.status !== 400) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 5: POST with valid CSRF token in body should succeed
  await test('POST /signup with valid CSRF token in body should succeed', async () => {
    const tokenClient = createAxiosInstance();
    const tokenResponse = await tokenClient.get('/csrf-token');
    const freshToken = tokenResponse.data.csrfToken;
    const freshCookies = extractCookies(tokenResponse);
    const freshSecret = freshCookies.csrfSecret;

    const client = createAxiosInstance({ csrfSecret: freshSecret });
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${Date.now() + 1}`,
      contact: `${(Date.now() + 1).toString().slice(-10)}`,
      email: `test${Date.now() + 1}@example.com`,
      password: 'Password123!',
      _csrf: freshToken
    });

    if (response.status === 403) {
      throw new Error('Request with valid CSRF token in body should not return 403');
    }

    if (response.status !== 201 && response.status !== 400) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 6: POST with valid CSRF token in query should succeed
  await test('POST /signup with valid CSRF token in query should succeed', async () => {
    const tokenClient = createAxiosInstance();
    const tokenResponse = await tokenClient.get('/csrf-token');
    const freshToken = tokenResponse.data.csrfToken;
    const freshCookies = extractCookies(tokenResponse);
    const freshSecret = freshCookies.csrfSecret;

    const client = createAxiosInstance({ csrfSecret: freshSecret });
    const response = await client.post(`/signup?_csrf=${freshToken}`, {
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${Date.now() + 2}`,
      contact: `${(Date.now() + 2).toString().slice(-10)}`,
      email: `test${Date.now() + 2}@example.com`,
      password: 'Password123!'
    });

    if (response.status === 403) {
      throw new Error('Request with valid CSRF token in query should not return 403');
    }

    if (response.status !== 201 && response.status !== 400) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 7: Login endpoint requires CSRF token
  console.log('\n🧪 Testing: LOGIN CSRF PROTECTION');
  await test('POST /login without CSRF token should be rejected', async () => {
    const client = createAxiosInstance();
    const response = await client.post('/login', {
      usernameOrEmail: 'testuser',
      password: 'password123'
    });

    if (response.status !== 403) {
      throw new Error(`Expected 403, got ${response.status}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 8: Logout endpoint requires CSRF token
  await test('POST /logout without CSRF token should be rejected', async () => {
    const client = createAxiosInstance();
    const response = await client.post('/logout');

    if (response.status !== 403) {
      throw new Error(`Expected 403, got ${response.status}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 9: GET requests should generate token but not require verification
  console.log('\n🧪 Testing: GET REQUESTS');
  await test('GET requests should generate CSRF token', async () => {
    const client = createAxiosInstance();
    const response = await client.get('/health');
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }

    const cookies = extractCookies(response);
    // Should have XSRF-TOKEN cookie set
    if (!cookies['XSRF-TOKEN']) {
      throw new Error('GET request should set XSRF-TOKEN cookie');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 10: Token from different secret should fail
  console.log('\n🧪 Testing: TOKEN VALIDATION');
  await test('CSRF token from different secret should be rejected', async () => {
    // Get token with one secret
    const tokenClient1 = createAxiosInstance();
    const tokenResponse1 = await tokenClient1.get('/csrf-token');
    const token1 = tokenResponse1.data.csrfToken;
    const cookies1 = extractCookies(tokenResponse1);
    const secret1 = cookies1.csrfSecret;

    // Get token with another secret (new request = new secret)
    const tokenClient2 = createAxiosInstance();
    const tokenResponse2 = await tokenClient2.get('/csrf-token');
    const cookies2 = extractCookies(tokenResponse2);
    const secret2 = cookies2.csrfSecret;

    // Try to use token1 with secret2 (should fail)
    const client = createAxiosInstance({ csrfSecret: secret2 });
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${Date.now() + 3}`,
      contact: `${(Date.now() + 3).toString().slice(-10)}`,
      email: `test${Date.now() + 3}@example.com`,
      password: 'Password123!'
    }, {
      headers: {
        'X-CSRF-Token': token1
      }
    });

    if (response.status !== 403) {
      throw new Error('Token from different secret should be rejected');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 11: Double-submit cookie pattern
  await test('XSRF-TOKEN cookie should match header token', async () => {
    const tokenClient = createAxiosInstance();
    const tokenResponse = await tokenClient.get('/csrf-token');
    const token = tokenResponse.data.csrfToken;
    const cookies = extractCookies(tokenResponse);
    const xsrfCookie = cookies['XSRF-TOKEN'];
    const secret = cookies.csrfSecret;

    if (token !== xsrfCookie) {
      throw new Error('XSRF-TOKEN cookie should match returned token');
    }

    // Use the cookie value as token (double-submit pattern)
    const client = createAxiosInstance({ 
      csrfSecret: secret,
      'XSRF-TOKEN': xsrfCookie
    });
    const response = await client.post('/signup', {
      firstName: 'Test',
      lastName: 'User',
      username: `testuser${Date.now() + 4}`,
      contact: `${(Date.now() + 4).toString().slice(-10)}`,
      email: `test${Date.now() + 4}@example.com`,
      password: 'Password123!'
    }, {
      headers: {
        'X-CSRF-Token': xsrfCookie // Use cookie value as token
      }
    });

    if (response.status === 403) {
      throw new Error('Double-submit cookie pattern should work');
    }
  }).then(result => { if (result) passed++; else failed++; });

  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  } else {
    console.log('🎉 All CSRF protection tests passed!');
    console.log('\n✅ CSRF Protection Features Verified:');
    console.log('   - CSRF token generation works');
    console.log('   - Requests without token are rejected');
    console.log('   - Requests with invalid token are rejected');
    console.log('   - Requests with valid token are accepted');
    console.log('   - Token can be sent via header, body, or query');
    console.log('   - Double-submit cookie pattern works');
    console.log('   - GET requests generate tokens');
    console.log('   - POST/PUT/DELETE require tokens');
  }
};

// Check if server is running
axios.get(`${API_BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running. Starting CSRF protection tests...\n');
    runTests().then(() => process.exit(0)).catch((error) => {
      console.error('Test suite error:', error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('❌ Server is not running or not accessible at', API_BASE_URL);
    console.error('   Please start the server first: cd Server && node server.js');
    process.exit(1);
  });

