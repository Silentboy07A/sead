const fetch = require('node-fetch');

async function testSecurity() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('--- Testing Rate Limiting ---');
    for (let i = 0; i < 55; i++) {
        const res = await fetch(`${baseUrl}/api/movies`);
        if (res.status === 429) {
            console.log(`✓ Rate limiting kicked in at request ${i+1}`);
            break;
        }
        if (i === 54) console.log('✗ Rate limiting failed to trigger');
    }

    console.log('\n--- Testing CORS Restriction ---');
    const corsRes = await fetch(`${baseUrl}/api/movies`, {
        headers: { 'Origin': 'https://malicious.com' }
    });
    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    if (!allowOrigin) {
        console.log('✓ CORS restricted: Access-Control-Allow-Origin not set for untrusted origin');
    } else {
        console.log(`✗ CORS leaked origin: ${allowOrigin}`);
    }

    console.log('\n--- Testing Admin Whitelisting (requires auth, but we can check if it accepts extra fields) ---');
    console.log('Manual check required on server logs if attempt is made.');
}

// Note: This script requires a running server.
// testSecurity();
