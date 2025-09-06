const fetch = require('node-fetch');

async function testBottleBalanceAPI() {
  try {
    console.log('🧪 Testing product-wise bottle balance API...');
    
    // Test 1: Get all bottle balances for customer ID 1
    console.log('\n1. Testing customer ID 1 (all products):');
    const response1 = await fetch('http://localhost:3001/api/customer-bottle-balance?customerId=1');
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(JSON.stringify(data1, null, 2));
    } else {
      console.log('Error:', response1.status, await response1.text());
    }
    
    // Test 2: Get bottle balance for specific customer and product
    console.log('\n2. Testing customer ID 1, product ID 1:');
    const response2 = await fetch('http://localhost:3001/api/customer-bottle-balance?customerId=1&productId=1');
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(JSON.stringify(data2, null, 2));
    } else {
      console.log('Error:', response2.status, await response2.text());
    }
    
    // Test 3: Get all customers for a specific product
    console.log('\n3. Testing all customers for product ID 1:');
    const response3 = await fetch('http://localhost:3001/api/customer-bottle-balance?productId=1');
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(JSON.stringify(data3, null, 2));
    } else {
      console.log('Error:', response3.status, await response3.text());
    }
    
    console.log('\n✅ API testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testBottleBalanceAPI();
