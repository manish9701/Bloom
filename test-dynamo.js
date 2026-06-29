/**
 * Quick DynamoDB Connection Test
 * 
 * This tests if your app can connect to DynamoDB
 * Usage: node test-dynamo.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnv();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'bloomGallery';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('╔══════════════════════════════════════════╗');
console.log('║   Bloom DynamoDB Connection Test        ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log(`   Region: ${REGION}`);
console.log(`   Table: ${TABLE_NAME}`);
console.log(`   Access Key: ${ACCESS_KEY ? ACCESS_KEY.substring(0, 8) + '...' : 'Not set'}\n`);

async function testConnection() {
  try {
    if (!ACCESS_KEY || !SECRET_KEY) {
      console.log('❌ Missing AWS credentials in .env file\n');
      return;
    }

    console.log('🔗 Creating DynamoDB client...');
    const client = new DynamoDBClient({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
    });

    const docClient = DynamoDBDocumentClient.from(client);
    console.log('✅ Client created successfully\n');

    // Test 1: Read from table
    console.log('📖 Test 1: Reading from table...');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 1,
    }));
    console.log(`✅ Read successful! Items found: ${scanResult.Items?.length || 0}\n`);

    // Test 2: Write test data
    console.log('✏️  Test 2: Writing test data...');
    const testData = {
      id: 'test_connection',
      type: 'test',
      data: JSON.stringify([{
        id: 'test-' + Date.now(),
        message: 'DynamoDB connection test successful!',
        timestamp: new Date().toISOString()
      }]),
      timestamp: Date.now()
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: testData,
    }));
    console.log('✅ Write successful!\n');

    // Test 3: Read the test data back
    console.log('📖 Test 3: Reading test data back...');
    const readResult = await docClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': 'test_connection'
      },
      Limit: 1,
    }));
    
    if (readResult.Items && readResult.Items.length > 0) {
      console.log('✅ Read back successful!');
      console.log(`   Data: ${readResult.Items[0].data.substring(0, 50)}...\n`);
    }

    console.log('╔══════════════════════════════════════════╗');
    console.log('║   ✨ ALL TESTS PASSED! ✨                ║');
    console.log('╚══════════════════════════════════════════╝\n');
    console.log('🎉 Your DynamoDB connection is working perfectly!');
    console.log('🚀 Your app will now persist data to DynamoDB.\n');
    console.log('Next steps:');
    console.log('   1. Start your app: npm start');
    console.log('   2. Save a look in the app');
    console.log('   3. Check AWS Console to see your data:\n');
    console.log(`   https://console.aws.amazon.com/dynamodb/home?region=${REGION}#item-explorer?table=${TABLE_NAME}\n`);

  } catch (error) {
    console.log('\n❌ Connection test failed!\n');
    console.error('Error:', error.message);
    
    if (error.name === 'InvalidSignatureException' || error.name === 'UnrecognizedClientException') {
      console.log('\n💡 Issue: Invalid AWS credentials');
      console.log('   Solution: Check your .env file:');
      console.log('   - Remove any parentheses: AWS_ACCESS_KEY_ID=AKIA...');
      console.log('   - Remove spaces around =');
      console.log('   - Make sure keys are correct\n');
    } else if (error.name === 'ResourceNotFoundException') {
      console.log('\n💡 Issue: Table not found');
      console.log('   Solution: Run the setup script:');
      console.log('   npm run setup:dynamodb\n');
    } else if (error.name === 'AccessDeniedException') {
      console.log('\n💡 Issue: Permission denied');
      console.log('   Solution: IAM user needs these permissions:');
      console.log('   - dynamodb:PutItem');
      console.log('   - dynamodb:Scan');
      console.log('   - dynamodb:GetItem\n');
    } else {
      console.log('\n💡 Debug information:');
      console.log('   Error name:', error.name);
      console.log('   Error code:', error.code);
      console.log('\n   Try checking AWS Console:');
      console.log(`   https://console.aws.amazon.com/dynamodb/home?region=${REGION}\n`);
    }
  }
}

testConnection();
