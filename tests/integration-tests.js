/**
 * Restaurant RAG System - Integration Tests
 * Tests the complete order flow from creation to completion
 */

const BASE_URL = 'http://localhost:3000';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  async run(testName, testFn) {
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✓ PASS: ${testName}`);
        this.passed++;
        this.results.push({ name: testName, status: 'PASS', details: result.message });
      } else {
        console.log(`✗ FAIL: ${testName} - ${result.message}`);
        this.failed++;
        this.results.push({ name: testName, status: 'FAIL', details: result.message });
      }
    } catch (error) {
      console.log(`✗ FAIL: ${testName} - ${error.message}`);
      this.failed++;
      this.results.push({ name: testName, status: 'FAIL', details: error.message });
    }
  }

  summary() {
    console.log('\n==========================================');
    console.log('Test Summary');
    console.log('==========================================');
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.passed + this.failed}`);
    return { passed: this.passed, failed: this.failed, results: this.results };
  }
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runTests() {
  const runner = new TestRunner();
  let testOrderId = null;

  console.log('==========================================');
  console.log('Restaurant RAG System - Integration Tests');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('==========================================\n');

  // ============ PAGE TESTS ============
  console.log('--- Page Load Tests ---');

  await runner.run('Home page loads', async () => {
    const res = await fetch(`${BASE_URL}/`);
    return {
      success: res.status === 200,
      message: `Status: ${res.status}`,
    };
  });

  await runner.run('Order page loads', async () => {
    const res = await fetch(`${BASE_URL}/order`);
    return {
      success: res.status === 200,
      message: `Status: ${res.status}`,
    };
  });

  await runner.run('Dashboard page loads', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`);
    return {
      success: res.status === 200,
      message: `Status: ${res.status}`,
    };
  });

  // ============ ORDER API TESTS ============
  console.log('\n--- Order API Tests ---');

  await runner.run('GET /api/orders returns order list', async () => {
    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders`);
    return {
      success: status === 200 && Array.isArray(data.orders),
      message: `Status: ${status}, Has orders array: ${Array.isArray(data.orders)}`,
    };
  });

  await runner.run('POST /api/orders creates new order', async () => {
    const orderData = {
      tableId: 'table-test-1',
      items: [
        { id: '1', name: 'Crispy Calamari', price: 14.99, quantity: 2 },
        { id: '5', name: 'Grilled Ribeye Steak', price: 52.99, quantity: 1 },
      ],
      customerName: 'Integration Test',
      notes: 'Test order - please ignore',
    };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    // API returns { order: { id, ... } }
    const order = data.order || data;
    if (status === 201 && order.id) {
      testOrderId = order.id;
      return {
        success: true,
        message: `Created order ${order.id}, total: $${order.total}`,
      };
    }
    return {
      success: false,
      message: `Status: ${status}, Response: ${JSON.stringify(data)}`,
    };
  });

  await runner.run('GET /api/orders/:id retrieves order', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}`);
    const order = data.order || data;
    return {
      success: status === 200 && order.id === testOrderId,
      message: `Status: ${status}, Order ID matches: ${order.id === testOrderId}`,
    };
  });

  await runner.run('Order has correct initial status (pending)', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}`);
    const order = data.order || data;
    return {
      success: order.status === 'pending',
      message: `Status: ${order.status}`,
    };
  });

  // ============ ORDER STATUS FLOW TESTS ============
  console.log('\n--- Order Status Flow Tests ---');

  await runner.run('Update status: pending → confirmed', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const order = data.order || data;
    return {
      success: status === 200 && order.status === 'confirmed',
      message: `New status: ${order.status}`,
    };
  });

  await runner.run('Update status: confirmed → preparing', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'preparing' }),
    });
    const order = data.order || data;
    return {
      success: status === 200 && order.status === 'preparing',
      message: `New status: ${order.status}`,
    };
  });

  await runner.run('Update status: preparing → ready', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ready' }),
    });
    const order = data.order || data;
    return {
      success: status === 200 && order.status === 'ready',
      message: `New status: ${order.status}`,
    };
  });

  await runner.run('Update status: ready → served', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'served' }),
    });
    const order = data.order || data;
    return {
      success: status === 200 && order.status === 'served',
      message: `New status: ${order.status}`,
    };
  });

  // ============ VALIDATION TESTS ============
  console.log('\n--- Validation Tests ---');

  await runner.run('Reject invalid status transition (served → pending)', async () => {
    if (!testOrderId) return { success: false, message: 'No test order ID' };

    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'pending' }),
    });
    return {
      success: status === 400 && data.error,
      message: `Status: ${status}, Has error: ${!!data.error}`,
    };
  });

  await runner.run('Reject order creation with missing tableId', async () => {
    const { status } = await fetchJSON(`${BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    });
    return {
      success: status === 400,
      message: `Status: ${status}`,
    };
  });

  await runner.run('Reject order creation with empty items', async () => {
    const { status } = await fetchJSON(`${BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify({ tableId: 'table-1', items: [] }),
    });
    return {
      success: status === 400,
      message: `Status: ${status}`,
    };
  });

  await runner.run('Return 404 for non-existent order', async () => {
    const { status } = await fetchJSON(`${BASE_URL}/api/orders/non-existent-order-id`);
    return {
      success: status === 404,
      message: `Status: ${status}`,
    };
  });

  // ============ FILTER TESTS ============
  console.log('\n--- Filter Tests ---');

  await runner.run('Filter orders by status', async () => {
    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders?status=served`);
    const allServed = data.orders?.every((o) => o.status === 'served') ?? true;
    return {
      success: status === 200 && allServed,
      message: `Status: ${status}, Count: ${data.orders?.length || 0}`,
    };
  });

  await runner.run('Filter orders by tableId', async () => {
    const { status, data } = await fetchJSON(`${BASE_URL}/api/orders?tableId=table-test-1`);
    return {
      success: status === 200 && Array.isArray(data.orders),
      message: `Status: ${status}, Count: ${data.orders?.length || 0}`,
    };
  });

  // ============ CLEANUP ============
  console.log('\n--- Cleanup ---');

  await runner.run('Delete/Cancel test order', async () => {
    if (!testOrderId) return { success: true, message: 'No order to delete' };

    // Try to cancel the order (change status to cancelled)
    const cancelRes = await fetchJSON(`${BASE_URL}/api/orders/${testOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });

    // For served orders, cancellation may fail which is acceptable
    // The test passes if either delete works OR the order is in a final state
    const deleteRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
      method: 'DELETE',
    });

    // Accept success (200/204) or client error (400) for served orders
    return {
      success: deleteRes.status === 200 || deleteRes.status === 204 || deleteRes.status === 400,
      message: `Delete status: ${deleteRes.status}, Cancel status: ${cancelRes.status}`,
    };
  });

  // ============ SUMMARY ============
  const summary = runner.summary();
  console.log(`\nCompleted: ${new Date().toISOString()}`);
  console.log('==========================================\n');

  return summary;
}

// Run tests
runTests()
  .then((summary) => {
    // Output JSON summary for parsing
    console.log('\n--- JSON Results ---');
    console.log(JSON.stringify(summary, null, 2));
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
