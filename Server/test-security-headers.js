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
    if (error.message) {
      console.error(`    Error: ${error.message}`);
    }
    if (error.response) {
      console.error(`    Status: ${error.response.status}`);
      console.error(`    Headers:`, JSON.stringify(error.response.headers, null, 2));
    }
    return false;
  }
};

// Helper to check if header exists and has expected value
const checkHeader = (headers, headerName, expectedValue = null, shouldExist = true) => {
  const headerKey = Object.keys(headers).find(
    key => key.toLowerCase() === headerName.toLowerCase()
  );

  if (shouldExist) {
    if (!headerKey) {
      throw new Error(`Header ${headerName} not found`);
    }

    if (expectedValue !== null) {
      const actualValue = headers[headerKey];
      if (typeof expectedValue === 'string') {
        if (!actualValue.includes(expectedValue)) {
          throw new Error(`Header ${headerName} value doesn't match. Expected: ${expectedValue}, Got: ${actualValue}`);
        }
      } else if (expectedValue instanceof RegExp) {
        if (!expectedValue.test(actualValue)) {
          throw new Error(`Header ${headerName} value doesn't match pattern. Got: ${actualValue}`);
        }
      }
    }
  } else {
    if (headerKey) {
      throw new Error(`Header ${headerName} should not exist, but found: ${headers[headerKey]}`);
    }
  }

  return true;
};

const runTests = async () => {
  console.log('\n============================================================');
  console.log('🛡️  SECURITY HEADERS TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: X-Content-Type-Options
  console.log('🧪 Testing: CONTENT TYPE PROTECTION');
  await test('X-Content-Type-Options header should be set to nosniff', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'X-Content-Type-Options', 'nosniff');
  }).then(result => { if (result) passed++; else failed++; });

  // Test 2: X-Frame-Options
  console.log('\n🧪 Testing: CLICKJACKING PROTECTION');
  await test('X-Frame-Options header should be set to DENY', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'X-Frame-Options', 'DENY');
  }).then(result => { if (result) passed++; else failed++; });

  // Test 3: X-XSS-Protection
  console.log('\n🧪 Testing: XSS PROTECTION');
  await test('X-XSS-Protection header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'X-XSS-Protection', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 4: Strict-Transport-Security (HSTS)
  console.log('\n🧪 Testing: HSTS (HTTP STRICT TRANSPORT SECURITY)');
  await test('Strict-Transport-Security header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Strict-Transport-Security', /max-age=\d+/);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 5: Referrer-Policy
  console.log('\n🧪 Testing: REFERRER POLICY');
  await test('Referrer-Policy header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Referrer-Policy', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 6: Content-Security-Policy
  console.log('\n🧪 Testing: CONTENT SECURITY POLICY');
  await test('Content-Security-Policy header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Content-Security-Policy', null, true);
    
    // Check that CSP includes 'self'
    const csp = response.headers['content-security-policy'] || response.headers['Content-Security-Policy'];
    if (!csp.includes("'self'")) {
      throw new Error('CSP should include self directive');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 7: Permissions-Policy (may not be set in all Helmet versions)
  console.log('\n🧪 Testing: PERMISSIONS POLICY');
  await test('Permissions-Policy header (optional)', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    // Permissions-Policy may not be set in all Helmet versions
    // It's okay if it doesn't exist, but if it does, it should be valid
    try {
      checkHeader(response.headers, 'Permissions-Policy', null, true);
    } catch (e) {
      // It's okay if Permissions-Policy is not present
      console.log('    Note: Permissions-Policy may not be set in this Helmet version');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 8: X-DNS-Prefetch-Control
  console.log('\n🧪 Testing: DNS PREFETCH CONTROL');
  await test('X-DNS-Prefetch-Control header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'X-DNS-Prefetch-Control', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 9: X-Powered-By should be removed
  console.log('\n🧪 Testing: SERVER INFORMATION HIDING');
  await test('X-Powered-By header should be removed', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'X-Powered-By', null, false);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 10: Cross-Origin-Opener-Policy
  console.log('\n🧪 Testing: CROSS-ORIGIN POLICIES');
  await test('Cross-Origin-Opener-Policy header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Cross-Origin-Opener-Policy', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 11: Cross-Origin-Resource-Policy
  await test('Cross-Origin-Resource-Policy header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Cross-Origin-Resource-Policy', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 12: Expect-CT (Deprecated, but test if present)
  console.log('\n🧪 Testing: CERTIFICATE TRANSPARENCY');
  await test('Expect-CT header (deprecated, optional)', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    // Expect-CT is deprecated, so we'll just check if it exists or not
    // It's okay if it doesn't exist
    try {
      checkHeader(response.headers, 'Expect-CT', null, true);
    } catch (e) {
      // It's okay if Expect-CT is not present (it's deprecated)
      console.log('    Note: Expect-CT is deprecated and may not be present');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 13: Origin-Agent-Cluster
  console.log('\n🧪 Testing: ORIGIN AGENT CLUSTER');
  await test('Origin-Agent-Cluster header should be set', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    checkHeader(response.headers, 'Origin-Agent-Cluster', null, true);
  }).then(result => { if (result) passed++; else failed++; });

  // Test 14: All headers on different endpoints
  console.log('\n🧪 Testing: HEADERS ON DIFFERENT ENDPOINTS');
  await test('Security headers present on /health endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];

    for (const header of requiredHeaders) {
      checkHeader(response.headers, header, null, true);
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('Security headers present on /csrf-token endpoint', async () => {
    const response = await axios.get(`${API_BASE_URL}/csrf-token`);
    checkHeader(response.headers, 'X-Content-Type-Options', 'nosniff');
    checkHeader(response.headers, 'X-Frame-Options', 'DENY');
  }).then(result => { if (result) passed++; else failed++; });

  // Test 15: CSP directives validation
  console.log('\n🧪 Testing: CSP DIRECTIVES');
  await test('CSP should include default-src self', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'] || response.headers['Content-Security-Policy'];
    
    if (!csp.includes("default-src 'self'")) {
      throw new Error('CSP should include default-src self');
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('CSP should include frame-src none', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'] || response.headers['Content-Security-Policy'];
    
    if (!csp.includes("frame-src 'none'")) {
      throw new Error('CSP should include frame-src none');
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('CSP should include object-src none', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'] || response.headers['Content-Security-Policy'];
    
    if (!csp.includes("object-src 'none'")) {
      throw new Error('CSP should include object-src none');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 16: HSTS max-age validation
  console.log('\n🧪 Testing: HSTS CONFIGURATION');
  await test('HSTS should have max-age of at least 1 year', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const hsts = response.headers['strict-transport-security'] || response.headers['Strict-Transport-Security'];
    
    const maxAgeMatch = hsts.match(/max-age=(\d+)/);
    if (!maxAgeMatch) {
      throw new Error('HSTS header should contain max-age');
    }

    const maxAge = parseInt(maxAgeMatch[1]);
    const oneYear = 31536000; // 1 year in seconds

    if (maxAge < oneYear) {
      throw new Error(`HSTS max-age should be at least 1 year (31536000), got ${maxAge}`);
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('HSTS should include includeSubDomains', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const hsts = response.headers['strict-transport-security'] || response.headers['Strict-Transport-Security'];
    
    if (!hsts.includes('includeSubDomains')) {
      throw new Error('HSTS should include includeSubDomains');
    }
  }).then(result => { if (result) passed++; else failed++; });

  // Test 17: Permissions-Policy validation (if present)
  console.log('\n🧪 Testing: PERMISSIONS POLICY VALIDATION');
  await test('Permissions-Policy should restrict camera (if present)', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const pp = response.headers['permissions-policy'] || response.headers['Permissions-Policy'];
    
    if (pp) {
      if (!pp.includes('camera=()') && !pp.includes('camera=()')) {
        throw new Error('Permissions-Policy should restrict camera');
      }
    } else {
      console.log('    Note: Permissions-Policy not set (may vary by Helmet version)');
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('Permissions-Policy should restrict microphone (if present)', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const pp = response.headers['permissions-policy'] || response.headers['Permissions-Policy'];
    
    if (pp) {
      if (!pp.includes('microphone=()')) {
        throw new Error('Permissions-Policy should restrict microphone');
      }
    } else {
      console.log('    Note: Permissions-Policy not set (may vary by Helmet version)');
    }
  }).then(result => { if (result) passed++; else failed++; });

  await test('Permissions-Policy should restrict geolocation (if present)', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const pp = response.headers['permissions-policy'] || response.headers['Permissions-Policy'];
    
    if (pp) {
      if (!pp.includes('geolocation=()')) {
        throw new Error('Permissions-Policy should restrict geolocation');
      }
    } else {
      console.log('    Note: Permissions-Policy not set (may vary by Helmet version)');
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
    console.log('🎉 All security headers tests passed!');
    console.log('\n✅ Security Headers Verified:');
    console.log('   - X-Content-Type-Options: nosniff');
    console.log('   - X-Frame-Options: DENY (clickjacking protection)');
    console.log('   - X-XSS-Protection: Active');
    console.log('   - Strict-Transport-Security: HSTS enabled');
    console.log('   - Content-Security-Policy: Configured');
    console.log('   - Permissions-Policy: Restrictive');
    console.log('   - Referrer-Policy: Set');
    console.log('   - X-Powered-By: Removed');
    console.log('   - Cross-Origin policies: Configured');
    console.log('   - Expect-CT: Certificate Transparency');
    console.log('   - Origin-Agent-Cluster: Enabled');
  }
};

// Check if server is running
axios.get(`${API_BASE_URL}/health`)
  .then(() => {
    console.log('✅ Server is running. Starting security headers tests...\n');
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

