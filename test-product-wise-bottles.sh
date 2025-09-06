#!/bin/bash

echo "🧪 Testing Product-wise Bottle Tracking System"
echo "=============================================="

# Test 1: Check customer bottle balance API
echo ""
echo "1. Testing customer bottle balance API (Customer ID 1):"
curl -s "http://localhost:3001/api/customer-bottle-balance?customerId=1" | head -5

echo ""
echo "2. Testing customer bottle balance API (Customer ID 1, Product ID 1):"
curl -s "http://localhost:3001/api/customer-bottle-balance?customerId=1&productId=1" | head -5

echo ""
echo "3. Testing customer product opening bottles API:"
curl -s "http://localhost:3001/api/customer-product-opening-bottles?customerId=1" | head -5

echo ""
echo "4. Creating a new opening bottle record for Customer 3, Product 2:"
curl -s -X POST "http://localhost:3001/api/customer-product-opening-bottles" \
  -H "Content-Type: application/json" \
  -d '{"customerId": 3, "productId": 2, "openingBottles": 5}' | head -5

echo ""
echo "5. Checking updated bottle balance for Customer 3:"
curl -s "http://localhost:3001/api/customer-bottle-balance?customerId=3" | head -5

echo ""
echo "✅ Test completed! Check the results above."
