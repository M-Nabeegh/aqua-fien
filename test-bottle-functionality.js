const http = require('http');

// First, let's check current bottle balance for customer 10
console.log('=== Testing Bottle Balance Functionality ===\n');

// Function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testBottleBalance() {
  try {
    // Step 1: Get current bottle balance for customer 10
    console.log('1. Getting current bottle balance for customer 10...');
    const balanceBefore = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customer-bottle-balance?customerId=10',
      method: 'GET'
    });
    
    console.log('Current balance:', JSON.stringify(balanceBefore.data, null, 2));
    
    if (balanceBefore.data.length === 0) {
      console.log('No balance data found for customer 10');
      return;
    }
    
    const currentBalance = balanceBefore.data[0];
    
    // Step 2: Create a new sell order with empty bottles collected
    console.log('\n2. Creating a sell order with 3 empty bottles collected...');
    const sellOrderData = {
      customerId: "10",
      productId: "1", // Assuming product 1 exists
      quantity: 5,
      emptyBottlesCollected: 3,
      billDate: new Date().toISOString().split('T')[0],
      salesmanAppointed: "aquafine"
    };
    
    const sellOrderResult = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/sell-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, JSON.stringify(sellOrderData));
    
    console.log('Sell order created:', sellOrderResult.status === 200 ? 'SUCCESS' : 'FAILED');
    if (sellOrderResult.status !== 200) {
      console.log('Error:', sellOrderResult.data);
      return;
    }
    
    // Step 3: Get updated bottle balance
    console.log('\n3. Getting updated bottle balance...');
    const balanceAfter = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/customer-bottle-balance?customerId=10',
      method: 'GET'
    });
    
    console.log('Updated balance:', JSON.stringify(balanceAfter.data, null, 2));
    
    if (balanceAfter.data.length > 0) {
      const newBalance = balanceAfter.data[0];
      console.log('\n=== COMPARISON ===');
      console.log(`Opening Bottles: ${currentBalance.openingBottles} → ${newBalance.openingBottles}`);
      console.log(`Total Delivered: ${currentBalance.totalDelivered} → ${newBalance.totalDelivered} (+${newBalance.totalDelivered - currentBalance.totalDelivered})`);
      console.log(`Empty Collected: ${currentBalance.totalEmptyCollected} → ${newBalance.totalEmptyCollected} (+${newBalance.totalEmptyCollected - currentBalance.totalEmptyCollected})`);
      console.log(`Current Balance: ${currentBalance.currentBottleBalance} → ${newBalance.currentBottleBalance} (change: ${newBalance.currentBottleBalance - currentBalance.currentBottleBalance})`);
      
      // Verify the math
      const expectedDeliveryIncrease = 5; // We delivered 5 bottles
      const expectedCollectionIncrease = 3; // We collected 3 empty bottles
      const expectedBalanceChange = expectedDeliveryIncrease - expectedCollectionIncrease; // +5 delivered - 3 collected = +2
      
      console.log('\n=== VERIFICATION ===');
      console.log(`Expected delivery increase: ${expectedDeliveryIncrease}`);
      console.log(`Actual delivery increase: ${newBalance.totalDelivered - currentBalance.totalDelivered}`);
      console.log(`Expected collection increase: ${expectedCollectionIncrease}`);
      console.log(`Actual collection increase: ${newBalance.totalEmptyCollected - currentBalance.totalEmptyCollected}`);
      console.log(`Expected balance change: +${expectedBalanceChange}`);
      console.log(`Actual balance change: ${newBalance.currentBottleBalance - currentBalance.currentBottleBalance}`);
      
      if (newBalance.currentBottleBalance - currentBalance.currentBottleBalance === expectedBalanceChange) {
        console.log('\n✅ BOTTLE BALANCE TRACKING IS WORKING CORRECTLY!');
      } else {
        console.log('\n❌ BOTTLE BALANCE CALCULATION IS INCORRECT!');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testBottleBalance();
