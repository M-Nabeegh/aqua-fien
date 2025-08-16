#!/bin/bash

# Network Setup Script for AquaFine Water Supply System
echo "🚀 Starting AquaFine Water Supply System on Network..."
echo "=================================================="

# Get network IP
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📡 Network IP detected: $NETWORK_IP"

echo ""
echo "🌐 Starting Next.js development server..."
echo "   - Binding to all network interfaces (0.0.0.0)"
echo "   - Port: 3000"
echo ""

# Start the development server
npm run dev
