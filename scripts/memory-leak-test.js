#!/usr/bin/env node

/**
 * Memory Leak Detection Script
 * Usage: npm run test:memory
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DURATION = 60000; // 1 minute
const INTERVAL = 1000; // Check every 1 second

function getMemoryUsage() {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
}

function makeRequest() {
  return new Promise((resolve) => {
    http.get(BASE_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.length));
    }).on('error', (err) => {
      console.error('Request error:', err.message);
      resolve(0);
    });
  });
}

async function detectMemoryLeaks() {
  console.log('💾 Starting memory leak detection...\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Duration: ${DURATION}ms\n`);

  const measurements = [];
  const startTime = Date.now();
  let requestCount = 0;

  const memoryCheckInterval = setInterval(async () => {
    const memory = getMemoryUsage();
    measurements.push(memory);

    process.stdout.write(`\r[${measurements.length}] Memory: ${memory}MB`);

    // Make a request
    try {
      await makeRequest();
      requestCount++;
    } catch (error) {
      console.error('Error making request:', error.message);
    }
  }, INTERVAL);

  // Wait for duration
  await new Promise((resolve) => setTimeout(resolve, DURATION));
  clearInterval(memoryCheckInterval);

  console.log('\n\n📊 Memory Analysis:\n');
  console.log(`Total requests: ${requestCount}`);
  console.log(`Measurements: ${measurements.length}`);
  console.log(`Initial memory: ${measurements[0]}MB`);
  console.log(`Final memory: ${measurements[measurements.length - 1]}MB`);
  console.log(
    `Peak memory: ${Math.max(...measurements)}MB`
  );
  console.log(
    `Average memory: ${Math.round(measurements.reduce((a, b) => a + b) / measurements.length)}MB`
  );

  const memoryIncrease = measurements[measurements.length - 1] - measurements[0];
  console.log(`\nMemory increase: ${memoryIncrease}MB`);

  if (memoryIncrease > 100) {
    console.log('⚠️  WARNING: Possible memory leak detected!');
    process.exit(1);
  } else if (memoryIncrease > 50) {
    console.log('⚠️  CAUTION: Significant memory increase');
  } else {
    console.log('✅ Memory usage appears stable');
  }
}

detectMemoryLeaks().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
