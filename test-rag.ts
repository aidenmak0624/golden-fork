/**
 * Quick test script to validate RAG system
 * Run with: npx ts-node test-rag.ts
 */

import { healthCheck } from './src/services/ragService';

async function testRAG() {
  console.log('🧪 Testing RAG System...\n');

  try {
    console.log('1️⃣ Checking API connections...');
    const health = await healthCheck();
    
    console.log('\n✅ Health Check Results:');
    console.log('   OpenAI:', health.openai ? '✅ Connected' : '❌ Failed');
    console.log('   Pinecone:', health.pinecone ? '✅ Connected' : '❌ Failed');
    
    if (health.indexStats) {
      console.log(`   Pinecone Index Stats: ${health.indexStats.totalVectors} vectors indexed`);
    }

    if (!health.openai || !health.pinecone) {
      console.error('\n❌ One or more services failed. Check your API keys in .env.local');
      process.exit(1);
    }

    console.log('\n2️⃣ Testing chat processing...');
    const { processChat } = await import('./src/services/ragService');
    
    const testMessage = 'What vegetarian options do you have?';
    console.log(`   Message: "${testMessage}"`);
    
    const response = await processChat({
      message: testMessage,
      sessionId: `test-${Date.now()}`,
    });

    console.log('\n✅ Chat Response:');
    console.log(`   Response: "${response.message}"`);
    console.log(`   Processing Time: ${response.processingTimeMs}ms`);
    console.log(`   Retrieved Items: ${response.retrievedItems?.length || 0} items`);
    console.log(`   Suggested Items: ${response.suggestedItems?.length || 0} items`);

    if (response.suggestedItems && response.suggestedItems.length > 0) {
      console.log('\n   Top suggestion:');
      const item = response.suggestedItems[0];
      console.log(`   - ${item.name} ($${item.price})`);
      console.log(`     ${item.description}`);
    }

    console.log('\n✅ RAG System is working! 🎉');
  } catch (error) {
    console.error('\n❌ Error testing RAG:');
    console.error(error);
    process.exit(1);
  }
}

testRAG();
