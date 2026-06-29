/**
 * DynamoDB Table Setup Script
 * 
 * This script creates the required DynamoDB table for the Bloom app.
 * 
 * Usage: node setup-dynamodb.js
 * 
 * Requirements:
 * - AWS credentials in .env file OR configured via AWS CLI
 * - Node.js installed
 */

// Load environment variables from .env file
const fs = require('fs');
const path = require('path');

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
    console.log('✓ Loaded environment variables from .env file');
  } else {
    console.log('⚠️  No .env file found, using AWS CLI default credentials');
  }
}

loadEnv();

const AWS = require('aws-sdk');

// Configuration from .env file
const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMO_TABLE_NAME || 'bloomGallery';
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

console.log('\n📋 Configuration:');
console.log(`   Region: ${REGION}`);
console.log(`   Table Name: ${TABLE_NAME}`);
console.log(`   Access Key: ${ACCESS_KEY ? ACCESS_KEY.substring(0, 8) + '...' : 'Not set (using AWS CLI default)'}`);
console.log('');

// Configure AWS SDK
if (ACCESS_KEY && SECRET_KEY) {
  AWS.config.update({
    region: REGION,
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY
  });
} else {
  AWS.config.update({ region: REGION });
}

const dynamodb = new AWS.DynamoDB();

async function setupTable() {
  console.log(`🚀 Setting up DynamoDB table: ${TABLE_NAME} in region: ${REGION}\n`);
  
  try {
    // Check if table exists
    console.log('🔍 Checking if table exists...');
    const listTables = await dynamodb.listTables().promise();
    const tableExists = listTables.TableNames?.includes(TABLE_NAME);
    
    if (tableExists) {
      console.log(`✅ Table "${TABLE_NAME}" already exists!\n`);
      
      // Show table details
      const desc = await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      console.log('📊 Table Details:');
      console.log(`   Status: ${desc.Table.TableStatus}`);
      console.log(`   Creation Time: ${desc.Table.CreationDateTime}`);
      console.log(`   Item Count: ${desc.Table.ItemCount}`);
      console.log(`   Table Size: ${(desc.Table.TableSizeBytes / 1024).toFixed(2)} KB`);
      console.log('\n✨ Your app is ready to use DynamoDB!');
      return;
    }
    
    // Create table
    console.log(`📝 Creating table "${TABLE_NAME}"...`);
    
    const params = {
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };
    
    await dynamodb.createTable(params).promise();
    
    console.log('✅ Table creation started!\n');
    console.log('⏳ Waiting for table to become active...');
    
    // Wait for table to be active
    const maxAttempts = 20;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const desc = await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      process.stdout.write(`   Status: ${desc.Table.TableStatus}...\r`);
      
      if (desc.Table.TableStatus === 'ACTIVE') {
        console.log('\n\n🎉 SUCCESS! Table is now ACTIVE and ready to use!');
        console.log('\n📊 Table Details:');
        console.log(`   ARN: ${desc.Table.TableArn}`);
        console.log(`   Region: ${REGION}`);
        console.log(`   Billing: Pay-per-request`);
        console.log('\n✨ Your app can now use DynamoDB for persistence!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Restart your app: npm start');
        console.log('   2. Check console for: [App] DynamoDB table ready for persistence');
        return;
      }
      
      attempts++;
    }
    
    console.log('\n\n⚠️  Table is still creating. This can take a minute.');
    console.log('Check the status in AWS Console:');
    console.log(`   https://console.aws.amazon.com/dynamodb/home?region=${REGION}#tables`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'InvalidSignatureException' || error.code === 'UnrecognizedClientException') {
      console.log('\n💡 AWS Credentials Issue:');
      console.log('   Check your .env file:');
      console.log('   - AWS_ACCESS_KEY_ID should have no spaces or parentheses');
      console.log('   - AWS_SECRET_ACCESS_KEY should have no spaces or parentheses');
      console.log('   - No spaces around the = sign');
    } else if (error.code === 'AccessDeniedException') {
      console.log('\n💡 Permission Issue:');
      console.log('   Your IAM user needs DynamoDB permissions:');
      console.log('   - dynamodb:CreateTable');
      console.log('   - dynamodb:DescribeTable');
      console.log('   - dynamodb:ListTables');
    } else {
      console.log('\n💡 Try these solutions:');
      console.log('   1. Check your .env file has correct AWS credentials');
      console.log('   2. Ensure credentials have DynamoDB permissions');
      console.log('   3. Try creating table via AWS Console:');
      console.log(`      https://console.aws.amazon.com/dynamodb/home?region=${REGION}#create-table`);
    }
    
    process.exit(1);
  }
}

console.log('╔════════════════════════════════════════╗');
console.log('║   Bloom DynamoDB Table Setup Script   ║');
console.log('╚════════════════════════════════════════╝\n');

setupTable();
