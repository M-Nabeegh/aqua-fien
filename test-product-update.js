const http = require('http');

// Test data
const productId = 4;
const updateData = {
  name: "19L Bottle API Test",
  basePrice: 199,
  category: "standard",
  minPrice: 169,
  maxPrice: 239
};

const data = JSON.stringify(updateData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/products/${productId}`,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing product update API...');
console.log('Update data:', updateData);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:', body);
    try {
      const jsonResponse = JSON.parse(body);
      if (jsonResponse.success && jsonResponse.data) {
        console.log('✅ Product update successful!');
        console.log('Updated product:', jsonResponse.data);
      } else {
        console.log('❌ Product update failed:', jsonResponse);
      }
    } catch (e) {
      console.log('Response (not JSON):', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();
