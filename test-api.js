const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing benchmarks API...');

    // Test GET request
    const response = await fetch('http://localhost:3000/api/benchmarks');
    const data = await response.json();

    console.log('GET response:', data);

    // Test sync request
    console.log('Testing sync...');
    const syncResponse = await fetch('http://localhost:3000/api/benchmarks?sync=true');
    const syncData = await syncResponse.json();

    console.log('Sync response:', syncData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
