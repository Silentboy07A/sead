const fetch = require('node-fetch');

async function testConcurrency() {
    const baseUrl = 'http://localhost:3000';
    const payload = {
        theatreId: 1,
        showIndex: 0,
        date: '2026-03-14',
        seats: ['A1', 'A2']
    };

    console.log('--- Testing Atomic Concurrency ---');
    console.log('Sending 2 simultaneous lock requests for the same seats...');

    const startTime = Date.now();
    const results = await Promise.allSettled([
        fetch(`${baseUrl}/api/lock-seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => r.json()),
        fetch(`${baseUrl}/api/lock-seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(r => r.json())
    ]);

    const duration = Date.now() - startTime;
    console.log(`Requests finished in ${duration}ms`);

    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            const data = res.value;
            console.log(`Response ${i + 1}:`, data.message || data.error);
        } else {
            console.log(`Response ${i + 1} Failed:`, res.reason.message);
        }
    });

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.message === 'Seats locked successfully').length;
    const conflictCount = results.filter(r => r.status === 'fulfilled' && r.value.error === 'DUPLICATE_LOCK').length;

    if (successCount === 1 && conflictCount === 1) {
        console.log('\n✓ ATOMICITY VERIFIED: Only 1 request succeeded, the other was rejected as a duplicate.');
    } else {
        console.log(`\n✗ ATOMICITY FAILED: Successes: ${successCount}, Conflicts: ${conflictCount}`);
        console.log('Double check that you have a running server and the indices were created correctly.');
    }
}

// testConcurrency();
