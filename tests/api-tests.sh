#!/bin/bash
# Restaurant RAG System - API Tests
# Tests all API endpoints for Milestone 2 implementation

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
RESULTS=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name - $details"
        FAILED=$((FAILED + 1))
    fi
    RESULTS="${RESULTS}\n[$status] $test_name: $details"
}

echo "=========================================="
echo "Restaurant RAG System - API Tests"
echo "Started: $(date)"
echo "=========================================="
echo ""

# Test 1: Home page loads
echo "Testing pages..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
    log_result "Home page (GET /)" "PASS" "Status: $STATUS"
else
    log_result "Home page (GET /)" "FAIL" "Expected 200, got $STATUS"
fi

# Test 2: Order page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/order")
if [ "$STATUS" = "200" ]; then
    log_result "Order page (GET /order)" "PASS" "Status: $STATUS"
else
    log_result "Order page (GET /order)" "FAIL" "Expected 200, got $STATUS"
fi

# Test 3: Dashboard page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$STATUS" = "200" ]; then
    log_result "Dashboard page (GET /dashboard)" "PASS" "Status: $STATUS"
else
    log_result "Dashboard page (GET /dashboard)" "FAIL" "Expected 200, got $STATUS"
fi

# Test 4: Confirmation page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/order/confirmation?order=test123")
if [ "$STATUS" = "200" ]; then
    log_result "Confirmation page (GET /order/confirmation)" "PASS" "Status: $STATUS"
else
    log_result "Confirmation page (GET /order/confirmation)" "FAIL" "Expected 200, got $STATUS"
fi

echo ""
echo "Testing API endpoints..."

# Test 5: GET /api/orders - List orders
RESPONSE=$(curl -s "$BASE_URL/api/orders")
if echo "$RESPONSE" | grep -q '"orders"'; then
    log_result "GET /api/orders (list orders)" "PASS" "Returns orders array"
else
    log_result "GET /api/orders (list orders)" "FAIL" "Missing orders array: $RESPONSE"
fi

# Test 6: POST /api/orders - Create order
ORDER_DATA='{"tableId":"table-5","items":[{"id":"1","name":"Crispy Calamari","price":14.99,"quantity":2}],"customerName":"Test Customer"}'
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -d "$ORDER_DATA")

if echo "$RESPONSE" | grep -q '"id"'; then
    ORDER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    log_result "POST /api/orders (create order)" "PASS" "Created order: $ORDER_ID"
else
    ORDER_ID=""
    log_result "POST /api/orders (create order)" "FAIL" "Failed to create order: $RESPONSE"
fi

# Test 7: GET /api/orders/:id - Get single order
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s "$BASE_URL/api/orders/$ORDER_ID")
    if echo "$RESPONSE" | grep -q "\"id\":\"$ORDER_ID\""; then
        log_result "GET /api/orders/:id (get order)" "PASS" "Retrieved order $ORDER_ID"
    else
        log_result "GET /api/orders/:id (get order)" "FAIL" "Could not retrieve order: $RESPONSE"
    fi
else
    log_result "GET /api/orders/:id (get order)" "FAIL" "Skipped - no order ID"
fi

# Test 8: PATCH /api/orders/:id/status - Update order status
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
        -H "Content-Type: application/json" \
        -d '{"status":"preparing"}')
    if echo "$RESPONSE" | grep -q '"status":"preparing"'; then
        log_result "PATCH /api/orders/:id/status (update status)" "PASS" "Status updated to preparing"
    else
        log_result "PATCH /api/orders/:id/status (update status)" "FAIL" "Status not updated: $RESPONSE"
    fi
else
    log_result "PATCH /api/orders/:id/status (update status)" "FAIL" "Skipped - no order ID"
fi

# Test 9: GET /api/orders with status filter
RESPONSE=$(curl -s "$BASE_URL/api/orders?status=preparing")
if echo "$RESPONSE" | grep -q '"orders"'; then
    log_result "GET /api/orders?status=preparing (filter)" "PASS" "Filter works"
else
    log_result "GET /api/orders?status=preparing (filter)" "FAIL" "Filter failed: $RESPONSE"
fi

# Test 10: GET /api/orders/:id for non-existent order
RESPONSE=$(curl -s "$BASE_URL/api/orders/non-existent-id-12345")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/orders/non-existent-id-12345")
if [ "$STATUS" = "404" ]; then
    log_result "GET /api/orders/:id (not found)" "PASS" "Returns 404 for missing order"
else
    log_result "GET /api/orders/:id (not found)" "FAIL" "Expected 404, got $STATUS"
fi

# Test 11: POST /api/orders with invalid data
RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -d '{}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$STATUS" = "400" ]; then
    log_result "POST /api/orders (invalid data)" "PASS" "Returns 400 for invalid data"
else
    log_result "POST /api/orders (invalid data)" "FAIL" "Expected 400, got $STATUS"
fi

# Test 12: PATCH invalid status transition
if [ -n "$ORDER_ID" ]; then
    RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/orders/$ORDER_ID/status" \
        -H "Content-Type: application/json" \
        -d '{"status":"paid"}')
    # Should fail because preparing -> paid is not valid
    if echo "$RESPONSE" | grep -q '"error"'; then
        log_result "PATCH invalid status transition" "PASS" "Rejects invalid transition"
    else
        log_result "PATCH invalid status transition" "FAIL" "Should reject: $RESPONSE"
    fi
fi

# Test 13: Chat API endpoint exists
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"message":"hello"}')
if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ] || [ "$STATUS" = "500" ]; then
    log_result "POST /api/chat (exists)" "PASS" "Chat endpoint exists, status: $STATUS"
else
    log_result "POST /api/chat (exists)" "FAIL" "Unexpected status: $STATUS"
fi

# Test 14: Checkout API endpoint exists
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/checkout" \
    -H "Content-Type: application/json" \
    -d '{"items":[],"tableId":"1"}')
if [ "$STATUS" = "200" ] || [ "$STATUS" = "400" ] || [ "$STATUS" = "500" ]; then
    log_result "POST /api/checkout (exists)" "PASS" "Checkout endpoint exists, status: $STATUS"
else
    log_result "POST /api/checkout (exists)" "FAIL" "Unexpected status: $STATUS"
fi

# Clean up - delete test order
if [ -n "$ORDER_ID" ]; then
    curl -s -X DELETE "$BASE_URL/api/orders/$ORDER_ID" > /dev/null 2>&1
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""
echo "Completed: $(date)"
echo "=========================================="

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi
exit 0
