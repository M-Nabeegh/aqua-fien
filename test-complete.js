const http = require('http');

function testServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/4',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Server is responding. Status:', res.statusCode);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.log('Server connection failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

function testProductUpdate() {
  return new Promise((resolve, reject) => {
    const updateData = {
      name: "19L Bottle API Final Test",
      basePrice: 200,
      category: "standard", 
      minPrice: 170,
      maxPrice: 240
    };

    const data = JSON.stringify(updateData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/products/4',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 10000
    };

    console.log('Testing product update...');
    
    const req = http.request(options, (res) => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Headers:', res.headers);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Response body:', body);
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200 && json.success) {
            console.log('✅ Product update API working!');
            console.log('Updated product:', json.data);
            resolve(json);
          } else {
            console.log('❌ Product update failed:', json);
            resolve(json);
          }
        } catch (e) {
          console.log('Non-JSON response:', body);
          resolve(body);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Request error:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ Request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing Product Update API...\n');
  
  try {
    // First test if server is responding
    console.log('1. Testing server connection...');
    await testServer();
    console.log('✅ Server is running\n');
    
    // Wait a bit for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test product update
    console.log('2. Testing product update...');
    await testProductUpdate();
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

main();
