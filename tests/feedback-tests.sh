#!/bin/bash
# Restaurant RAG System - Feedback API Tests
# Tests the customer feedback and AI insights system

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

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
}

echo "=========================================="
echo "Restaurant RAG System - Feedback Tests"
echo "Started: $(date)"
echo "=========================================="
echo ""

# Test 1: Create feedback
echo "Testing Feedback API..."
cat > /tmp/feedback-test.json << 'EOF'
{
  "orderId": "ORD-FEEDBACK-TEST-001",
  "tableId": "10",
  "rating": 5,
  "foodRating": 5,
  "serviceRating": 5,
  "ambienceRating": 4,
  "comment": "Excellent dining experience!",
  "wouldRecommend": true
}
EOF

RESPONSE=$(curl -s -X POST "$BASE_URL/api/feedback" \
  -H "Content-Type: application/json" \
  -d @/tmp/feedback-test.json)

if echo "$RESPONSE" | grep -q '"id"'; then
    log_result "POST /api/feedback (create feedback)" "PASS" "Created feedback"
else
    log_result "POST /api/feedback (create feedback)" "FAIL" "$RESPONSE"
fi

# Test 2: Duplicate feedback rejection
RESPONSE=$(curl -s -X POST "$BASE_URL/api/feedback" \
  -H "Content-Type: application/json" \
  -d @/tmp/feedback-test.json)

if echo "$RESPONSE" | grep -q 'already submitted'; then
    log_result "POST /api/feedback (duplicate rejection)" "PASS" "Correctly rejects duplicate"
else
    log_result "POST /api/feedback (duplicate rejection)" "FAIL" "$RESPONSE"
fi

# Test 3: Get feedback list
RESPONSE=$(curl -s "$BASE_URL/api/feedback")
if echo "$RESPONSE" | grep -q '"feedback"'; then
    log_result "GET /api/feedback (list)" "PASS" "Returns feedback array"
else
    log_result "GET /api/feedback (list)" "FAIL" "$RESPONSE"
fi

# Test 4: Get feedback stats
RESPONSE=$(curl -s "$BASE_URL/api/feedback/stats")
if echo "$RESPONSE" | grep -q '"totalReviews"'; then
    log_result "GET /api/feedback/stats" "PASS" "Returns stats"
else
    log_result "GET /api/feedback/stats" "FAIL" "$RESPONSE"
fi

# Test 5: Stats have correct structure
if echo "$RESPONSE" | grep -q '"averageRating"' && \
   echo "$RESPONSE" | grep -q '"recommendationRate"' && \
   echo "$RESPONSE" | grep -q '"ratingDistribution"'; then
    log_result "Feedback stats structure" "PASS" "All fields present"
else
    log_result "Feedback stats structure" "FAIL" "Missing fields"
fi

# Test 6: Create feedback with missing fields (should fail)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/feedback" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test"}')
if [ "$STATUS" = "400" ]; then
    log_result "POST /api/feedback (validation)" "PASS" "Rejects invalid data"
else
    log_result "POST /api/feedback (validation)" "FAIL" "Expected 400, got $STATUS"
fi

echo ""
echo "Testing AI Insights API..."

# Test 7: Get insights with seed data
RESPONSE=$(curl -s "$BASE_URL/api/insights?seed=true")
if echo "$RESPONSE" | grep -q '"insights"'; then
    log_result "GET /api/insights" "PASS" "Returns insights"
else
    log_result "GET /api/insights" "FAIL" "$RESPONSE"
fi

# Test 8: Insights contain chat data
if echo "$RESPONSE" | grep -q '"recentChats"'; then
    log_result "Insights contain recentChats" "PASS" "Has chat data"
else
    log_result "Insights contain recentChats" "FAIL" "Missing recentChats"
fi

# Test 9: Insights contain dietary trends
if echo "$RESPONSE" | grep -q '"dietaryTrends"'; then
    log_result "Insights contain dietaryTrends" "PASS" "Has dietary trends"
else
    log_result "Insights contain dietaryTrends" "FAIL" "Missing dietaryTrends"
fi

# Test 10: Insights contain feedback insights
if echo "$RESPONSE" | grep -q '"feedbackInsights"'; then
    log_result "Insights contain feedbackInsights" "PASS" "Has feedback insights"
else
    log_result "Insights contain feedbackInsights" "FAIL" "Missing feedbackInsights"
fi

# Test 11: Log chat interaction
RESPONSE=$(curl -s -X POST "$BASE_URL/api/insights" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-session","userMessage":"Do you have gluten-free options?","assistantResponse":"Yes, we have several gluten-free dishes.","intent":"dietary_inquiry","dietaryMentions":["gluten-free"],"tableId":"5"}')

if echo "$RESPONSE" | grep -q '"chatLog"'; then
    log_result "POST /api/insights (log chat)" "PASS" "Chat logged"
else
    log_result "POST /api/insights (log chat)" "FAIL" "$RESPONSE"
fi

echo ""
echo "Testing Dashboard Pages..."

# Test 12: Dashboard loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$STATUS" = "200" ]; then
    log_result "Dashboard page loads" "PASS" "Status: $STATUS"
else
    log_result "Dashboard page loads" "FAIL" "Expected 200, got $STATUS"
fi

# Test 13: Order confirmation page loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/order/confirmation?order=test")
if [ "$STATUS" = "200" ]; then
    log_result "Confirmation page loads" "PASS" "Status: $STATUS"
else
    log_result "Confirmation page loads" "FAIL" "Expected 200, got $STATUS"
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

# Clean up
rm -f /tmp/feedback-test.json

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
fi
exit 0
