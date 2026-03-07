/**
 * Chatbot Black-Box Test Runner
 *
 * Runs all 50 test cases against the chatbot API and validates responses.
 * Usage: npx ts-node tests/chatbot-test-runner.ts
 *
 * Requires: OPENAI_API_KEY and PINECONE_API_KEY in environment
 * The Next.js dev server must be running on localhost:3000
 */

import fs from 'fs';
import path from 'path';

interface TestCase {
  id: number;
  category: string;
  input: string;
  expectedBehavior: string;
  mustNotContain: string[];
  mustMention: string[];
}

interface TestResult {
  id: number;
  category: string;
  input: string;
  response: string;
  passed: boolean;
  failures: string[];
  warnings: string[];
}

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';

async function sendChatMessage(message: string, conversationHistory: any[] = []): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      tableId: 'test-table-1',
      conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.message || data.response || '';
}

function validateResponse(response: string, testCase: TestCase): { passed: boolean; failures: string[]; warnings: string[] } {
  const failures: string[] = [];
  const warnings: string[] = [];
  const lowerResponse = response.toLowerCase();

  // Check mustNotContain
  for (const phrase of testCase.mustNotContain) {
    if (lowerResponse.includes(phrase.toLowerCase())) {
      failures.push(`FAIL: Response contains forbidden phrase: "${phrase}"`);
    }
  }

  // Check mustMention (special handling for generic placeholders)
  for (const phrase of testCase.mustMention) {
    if (phrase === 'menu item name') {
      // Check if response mentions any known menu item
      const menuItems = [
        'calamari', 'burrata', 'lettuce wrap', 'beet', 'caesar', 'duck',
        'ribeye', 'salmon', 'lobster', 'risotto', 'portobello', 'curry',
        'carbonara', 'fettuccine', 'mushroom', 'truffle', 'broccolini',
        'lava cake', 'crème brûlée', 'panna cotta', 'cabernet', 'chardonnay',
        'lemonade', 'thai iced tea'
      ];
      const mentionsItem = menuItems.some(item => lowerResponse.includes(item));
      if (!mentionsItem) {
        failures.push('FAIL: Response does not mention any specific menu item');
      }
    } else if (phrase === '$') {
      if (!/\$\d/.test(response)) {
        warnings.push('WARNING: Response does not include prices');
      }
    } else {
      if (!lowerResponse.includes(phrase.toLowerCase())) {
        warnings.push(`WARNING: Response does not mention "${phrase}"`);
      }
    }
  }

  // Generic quality checks
  if (response.length < 20) {
    failures.push('FAIL: Response is too short (< 20 chars)');
  }
  if (response.length > 2000) {
    warnings.push('WARNING: Response is very long (> 2000 chars)');
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
  };
}

async function runTests(): Promise<void> {
  // Load test cases
  const testCasesPath = path.join(__dirname, 'chatbot-test-cases.json');
  const testData = JSON.parse(fs.readFileSync(testCasesPath, 'utf-8'));
  const testCases: TestCase[] = testData.testCases;

  console.log(`\n🧪 Golden Fork Chatbot Test Runner`);
  console.log(`📋 Running ${testCases.length} test cases against ${API_URL}\n`);
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`  Test #${String(testCase.id).padStart(2, '0')} [${testCase.category}]: `);

    try {
      const response = await sendChatMessage(testCase.input);
      const validation = validateResponse(response, testCase);

      const result: TestResult = {
        id: testCase.id,
        category: testCase.category,
        input: testCase.input,
        response,
        ...validation,
      };
      results.push(result);

      if (validation.passed) {
        passed++;
        console.log(`✅ PASS`);
      } else {
        failed++;
        console.log(`❌ FAIL`);
        validation.failures.forEach(f => console.log(`     ${f}`));
      }
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => console.log(`     ${w}`));
      }

      // Rate limit: wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failed++;
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`💥 ERROR: ${errMsg}`);
      results.push({
        id: testCase.id,
        category: testCase.category,
        input: testCase.input,
        response: '',
        passed: false,
        failures: [`ERROR: ${errMsg}`],
        warnings: [],
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Results Summary:`);
  console.log(`   Total:  ${testCases.length}`);
  console.log(`   Passed: ${passed} (${((passed / testCases.length) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${failed} (${((failed / testCases.length) * 100).toFixed(1)}%)`);

  // Category breakdown
  const categories = new Map<string, { pass: number; fail: number }>();
  for (const result of results) {
    const cat = categories.get(result.category) || { pass: 0, fail: 0 };
    if (result.passed) cat.pass++;
    else cat.fail++;
    categories.set(result.category, cat);
  }

  console.log(`\n📂 By Category:`);
  for (const [cat, stats] of categories) {
    const total = stats.pass + stats.fail;
    const pct = ((stats.pass / total) * 100).toFixed(0);
    console.log(`   ${cat.padEnd(25)} ${stats.pass}/${total} (${pct}%)`);
  }

  // Save full results
  const outputPath = path.join(__dirname, 'chatbot-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { total: testCases.length, passed, failed },
    results
  }, null, 2));
  console.log(`\n💾 Full results saved to: ${outputPath}\n`);

  // Exit with error code if failures
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
